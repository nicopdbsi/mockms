import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, crypto } from "./auth";
import passport from "passport";
import multer from "multer";
import { insertUserSchema, insertSupplierSchema, insertIngredientSchema, insertMaterialSchema, insertRecipeSchema, insertOrderSchema, insertIngredientCategorySchema, insertMaterialCategorySchema, insertStarterIngredientSchema, insertStarterMaterialSchema } from "@shared/schema";
import { z } from "zod";
import { parseReceiptImage, parseReceiptCSV, parseReceiptPDF } from "./receipt-parser";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'text/csv'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PNG, JPG, PDF, CSV'));
    }
  }
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user as any;
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const schema = insertUserSchema.extend({
        email: z.string().email(),
      });
      const data = schema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await crypto.hash(data.password);
      
      // Check if this is the first user
      const userCount = await storage.getUserCount();
      const role = userCount === 0 ? "admin" : "regular";
      
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        role,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.login(user, async (err) => {
        if (err) return next(err);
        try {
          await storage.updateLastLogin((user as any).id);
        } catch (e) {
          console.error("Failed to update last login:", e);
        }
        const { password, ...userWithoutPassword } = user as any;
        res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });

  // Suppliers routes
  app.get("/api/suppliers", requireAuth, async (req, res, next) => {
    try {
      const suppliers = await storage.getSuppliers(req.user!.id);
      res.json(suppliers);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/suppliers", requireAuth, async (req, res, next) => {
    try {
      const data = insertSupplierSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const supplier = await storage.createSupplier(data);
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/suppliers/:id", requireAuth, async (req, res, next) => {
    try {
      const supplier = await storage.updateSupplier(
        req.params.id,
        req.user!.id,
        req.body
      );
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteSupplier(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json({ message: "Supplier deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Ingredients routes
  app.get("/api/ingredients", requireAuth, async (req, res, next) => {
    try {
      const ingredients = await storage.getIngredients(req.user!.id);
      res.json(ingredients);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ingredients", requireAuth, async (req, res, next) => {
    try {
      const data = insertIngredientSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const ingredient = await storage.createIngredient(data);
      res.json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/ingredients/:id", requireAuth, async (req, res, next) => {
    try {
      const ingredient = await storage.updateIngredient(
        req.params.id,
        req.user!.id,
        req.body
      );
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json(ingredient);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/ingredients/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteIngredient(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      res.json({ message: "Ingredient deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/ingredients/:id/recipes", requireAuth, async (req, res, next) => {
    try {
      const recipes = await storage.getRecipesByIngredient(req.params.id, req.user!.id);
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  });

  // Materials routes
  app.get("/api/materials", requireAuth, async (req, res, next) => {
    try {
      const materials = await storage.getMaterials(req.user!.id);
      res.json(materials);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/materials", requireAuth, async (req, res, next) => {
    try {
      const data = insertMaterialSchema.parse({
        ...req.body,
        userId: req.user!.id,
        quantity: req.body.quantity ? parseFloat(req.body.quantity) || null : null,
        pricePerUnit: req.body.pricePerUnit ? parseFloat(req.body.pricePerUnit) || null : null,
        purchaseAmount: req.body.purchaseAmount ? parseFloat(req.body.purchaseAmount) || null : null,
      });
      const material = await storage.createMaterial(data);
      res.json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/materials/:id", requireAuth, async (req, res, next) => {
    try {
      const material = await storage.updateMaterial(
        req.params.id,
        req.user!.id,
        {
          ...req.body,
          quantity: req.body.quantity ? parseFloat(req.body.quantity) || null : null,
          pricePerUnit: req.body.pricePerUnit ? parseFloat(req.body.pricePerUnit) || null : null,
          purchaseAmount: req.body.purchaseAmount ? parseFloat(req.body.purchaseAmount) || null : null,
        }
      );
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/materials/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteMaterial(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.json({ message: "Material deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Recipes routes
  app.get("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const recipes = await storage.getRecipes(req.user!.id);
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      const recipe = await storage.getRecipeWithAccess(
        req.params.id, 
        user.id, 
        user.email, 
        user.planType, 
        user.role
      );
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      const ingredients = await storage.getRecipeIngredients(req.params.id);
      const recipeMaterials = await storage.getRecipeMaterials(req.params.id);
      res.json({ ...recipe, ingredients, materials: recipeMaterials });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const { ingredients, materials, accessType, allowedPlans, allowedUserEmails, ...recipeData } = req.body;
      
      // Parse numeric fields properly - ensure they are strings for numeric columns
      const parseNumericField = (val: any, defaultVal: string | null): string | null => {
        if (val === undefined || val === null || val === "") return defaultVal;
        const num = parseFloat(val);
        return isNaN(num) ? defaultVal : num.toString();
      };
      
      const parseIntField = (val: any, defaultVal: number | null): number | null => {
        if (val === undefined || val === null || val === "") return defaultVal;
        const num = parseInt(val);
        return isNaN(num) ? defaultVal : num;
      };
      
      const data = insertRecipeSchema.parse({
        ...recipeData,
        userId: req.user!.id,
        targetMargin: parseNumericField(recipeData.targetMargin, "0"),
        targetFoodCost: parseNumericField(recipeData.targetFoodCost, "30"),
        laborCost: parseNumericField(recipeData.laborCost, "0"),
        batchYield: parseIntField(recipeData.batchYield, 1),
        servings: parseIntField(recipeData.servings, 1),
        standardYieldPieces: parseIntField(recipeData.standardYieldPieces, null),
        standardYieldWeightPerPiece: parseNumericField(recipeData.standardYieldWeightPerPiece, null),
        standardNumTrays: parseIntField(recipeData.standardNumTrays, null),
      });
      const recipe = await storage.createRecipe(data);
      
      // Update access control settings if provided and user is admin creating a free recipe
      if (accessType && recipe.isFreeRecipe && (req.user as any).role === "admin") {
        await storage.updateRecipeFreeStatus(
          recipe.id,
          req.user!.id,
          true,
          accessType,
          allowedPlans,
          allowedUserEmails
        );
      }
      
      if (ingredients && Array.isArray(ingredients)) {
        // Filter out empty ingredient rows (no ingredientId selected)
        const validIngredients = ingredients.filter((ing: any) => ing.ingredientId && ing.ingredientId.trim() !== "");
        for (let index = 0; index < validIngredients.length; index++) {
          const ing = validIngredients[index];
          await storage.createRecipeIngredient({
            recipeId: recipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity || "0",
            componentName: ing.componentName || null,
            unit: ing.unit || "g",
            order: index,
          });
        }
      }

      if (materials && Array.isArray(materials)) {
        // Filter out empty material rows (no materialId selected)
        const validMaterials = materials.filter((mat: any) => mat.materialId && mat.materialId.trim() !== "");
        for (const mat of validMaterials) {
          await storage.createRecipeMaterial({
            recipeId: recipe.id,
            materialId: mat.materialId,
            quantity: mat.quantity || "0",
          });
        }
      }
      
      const recipeIngredients = await storage.getRecipeIngredients(recipe.id);
      const recipeMaterials = await storage.getRecipeMaterials(recipe.id);
      res.json({ ...recipe, ingredients: recipeIngredients, materials: recipeMaterials });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const { ingredients, materials, accessType, allowedPlans, allowedUserEmails, ...recipeData } = req.body;
      const recipe = await storage.updateRecipe(
        req.params.id,
        req.user!.id,
        recipeData
      );
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      // Update access control settings if provided and user is admin
      if (accessType && recipe.isFreeRecipe && (req.user as any).role === "admin") {
        await storage.updateRecipeFreeStatus(
          req.params.id,
          req.user!.id,
          true,
          accessType,
          allowedPlans,
          allowedUserEmails
        );
      }

      if (ingredients && Array.isArray(ingredients)) {
        await storage.deleteRecipeIngredientsByRecipe(req.params.id);
        // Filter out empty ingredient rows (no ingredientId selected)
        const validIngredients = ingredients.filter((ing: any) => ing.ingredientId && ing.ingredientId.trim() !== "");
        for (let index = 0; index < validIngredients.length; index++) {
          const ing = validIngredients[index];
          await storage.createRecipeIngredient({
            recipeId: recipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity || "0",
            componentName: ing.componentName || null,
            unit: ing.unit || "g",
            order: index,
          });
        }
      }

      if (materials && Array.isArray(materials)) {
        await storage.deleteRecipeMaterialsByRecipe(req.params.id);
        // Filter out empty material rows (no materialId selected)
        const validMaterials = materials.filter((mat: any) => mat.materialId && mat.materialId.trim() !== "");
        for (const mat of validMaterials) {
          await storage.createRecipeMaterial({
            recipeId: recipe.id,
            materialId: mat.materialId,
            quantity: mat.quantity || "0",
          });
        }
      }

      const recipeIngredients = await storage.getRecipeIngredients(recipe.id);
      const recipeMaterials = await storage.getRecipeMaterials(recipe.id);
      res.json({ ...recipe, ingredients: recipeIngredients, materials: recipeMaterials });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteRecipe(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json({ message: "Recipe deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/free-recipes", requireAuth, async (req, res, next) => {
    try {
      const user = req.user as any;
      const freeRecipes = await storage.getFreeRecipes(user.id, user.email, user.plan, user.role);
      res.json(freeRecipes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recipes/:id/clone", requireAuth, async (req, res, next) => {
    try {
      const cloned = await storage.cloneRecipe(req.params.id, req.user!.id);
      if (!cloned) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(cloned);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/recipes/:id/free", requireAuth, async (req, res, next) => {
    try {
      const { isFree, accessType, allowedPlans, allowedUserEmails } = req.body;
      const updated = await storage.updateRecipeFreeStatus(
        req.params.id,
        req.user!.id,
        isFree,
        accessType,
        allowedPlans,
        allowedUserEmails
      );
      if (!updated) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/recipes/:id/visibility", requireAuth, async (req, res, next) => {
    try {
      const { isVisible } = req.body;
      const updated = await storage.toggleRecipeVisibility(req.params.id, req.user!.id, isVisible);
      if (!updated) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Orders routes
  app.get("/api/orders", requireAuth, async (req, res, next) => {
    try {
      const orders = await storage.getOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders", requireAuth, async (req, res, next) => {
    try {
      const data = insertOrderSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const order = await storage.createOrder(data);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/analytics/overview", requireAuth, async (req, res, next) => {
    try {
      const recipes = await storage.getRecipes(req.user!.id);
      const orders = await storage.getOrders(req.user!.id);
      const ingredients = await storage.getIngredients(req.user!.id);

      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalRevenue), 0);
      const totalCost = orders.reduce((sum, order) => sum + Number(order.totalCost), 0);
      const totalProfit = totalRevenue - totalCost;

      res.json({
        totalRecipes: recipes.length,
        totalOrders: orders.length,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0,
        totalIngredients: ingredients.length,
      });
    } catch (error) {
      next(error);
    }
  });

  // Ingredient Categories routes
  app.get("/api/ingredient-categories", requireAuth, async (req, res, next) => {
    try {
      const categories = await storage.getIngredientCategories(req.user!.id);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ingredient-categories", requireAuth, async (req, res, next) => {
    try {
      const data = insertIngredientCategorySchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const category = await storage.createIngredientCategory(data);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/ingredient-categories/:id", requireAuth, async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Name is required" });
      }
      const category = await storage.updateIngredientCategory(
        req.params.id,
        req.user!.id,
        name
      );
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/ingredient-categories/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteIngredientCategory(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Material Categories routes
  app.get("/api/material-categories", requireAuth, async (req, res, next) => {
    try {
      const categories = await storage.getMaterialCategories(req.user!.id);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/material-categories", requireAuth, async (req, res, next) => {
    try {
      const data = insertMaterialCategorySchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      const category = await storage.createMaterialCategory(data);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/material-categories/:id", requireAuth, async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Name is required" });
      }
      const category = await storage.updateMaterialCategory(
        req.params.id,
        req.user!.id,
        name
      );
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/material-categories/:id", requireAuth, async (req, res, next) => {
    try {
      const deleted = await storage.deleteMaterialCategory(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdminRole, async (req, res, next) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/users", requireAdminRole, async (req, res, next) => {
    try {
      const allUsers = await storage.getAllUsers();
      const sanitized = allUsers.map(({ password, ...user }) => user);
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdminRole, async (req, res, next) => {
    try {
      const { role } = req.body;
      const validRoles = ["regular", "beta_tester", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...sanitized } = updatedUser;
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", requireAdminRole, async (req, res, next) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id/status", requireAdminRole, async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!["active", "inactive", "suspended"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const updated = await storage.updateUserStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...sanitized } = updated;
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/export/users", requireAdminRole, async (req, res, next) => {
    try {
      const allUsers = await storage.getAllUsers();
      const csv = [
        "ID,Username,Email,Name,Business,Role,Status,Created,Last Login",
        ...allUsers.map(u => 
          `"${u.id}","${u.username}","${u.email}","${u.firstName || ''}","${u.businessName || ''}","${u.role}","${u.status}","${u.createdAt}","${u.lastLogin || ''}"`
        )
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=users.csv");
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });

  // User settings routes
  app.patch("/api/user/settings", requireAuth, async (req, res, next) => {
    try {
      const { currency, timezone } = req.body;
      if (!currency || !timezone) {
        return res.status(400).json({ message: "Currency and timezone are required" });
      }
      const updated = await storage.updateUserSettings(req.user!.id, currency, timezone);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...sanitized } = updated;
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/user/credentials", requireAuth, async (req, res, next) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const hashedPassword = await crypto.hash(password);
      const updated = await storage.updateUserCredentials(req.user!.id, username, hashedPassword);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...sanitized } = updated;
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  // Receipt parsing endpoint
  app.post("/api/parse-receipt", requireAuth, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      let result;

      if (file.mimetype === "text/csv") {
        const csvContent = file.buffer.toString("utf-8");
        result = await parseReceiptCSV(csvContent);
      } else if (file.mimetype.startsWith("image/")) {
        const base64 = file.buffer.toString("base64");
        result = await parseReceiptImage(base64, file.mimetype);
      } else if (file.mimetype === "application/pdf") {
        result = await parseReceiptPDF(file.buffer);
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Receipt parsing error:", error);
      res.status(500).json({ message: error.message || "Failed to parse receipt" });
    }
  });

  // =============================================
  // BENTO STARTER PACK ROUTES
  // =============================================

  // Starter Ingredients (Admin CRUD)
  app.get("/api/starter-pack/ingredients", requireAuth, async (req, res, next) => {
    try {
      const items = await storage.getStarterIngredients();
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/starter-pack/ingredients", requireAdminRole, async (req, res, next) => {
    try {
      const data = insertStarterIngredientSchema.parse(req.body);
      const item = await storage.createStarterIngredient(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/starter-pack/ingredients/:id", requireAdminRole, async (req, res, next) => {
    try {
      const updated = await storage.updateStarterIngredient(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Starter ingredient not found" });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/starter-pack/ingredients/:id", requireAdminRole, async (req, res, next) => {
    try {
      const deleted = await storage.deleteStarterIngredient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Starter ingredient not found" });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Starter Materials (Admin CRUD)
  app.get("/api/starter-pack/materials", requireAuth, async (req, res, next) => {
    try {
      const items = await storage.getStarterMaterials();
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/starter-pack/materials", requireAdminRole, async (req, res, next) => {
    try {
      const data = insertStarterMaterialSchema.parse(req.body);
      const item = await storage.createStarterMaterial(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/starter-pack/materials/:id", requireAdminRole, async (req, res, next) => {
    try {
      const updated = await storage.updateStarterMaterial(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Starter material not found" });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/starter-pack/materials/:id", requireAdminRole, async (req, res, next) => {
    try {
      const deleted = await storage.deleteStarterMaterial(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Starter material not found" });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Import starter pack to user's inventory
  app.post("/api/starter-pack/import", requireAuth, async (req, res, next) => {
    try {
      const { ingredientIds, materialIds } = req.body;
      
      if (!Array.isArray(ingredientIds) || !Array.isArray(materialIds)) {
        return res.status(400).json({ message: "ingredientIds and materialIds must be arrays" });
      }

      const result = await storage.importStarterPack(
        req.user!.id,
        ingredientIds,
        materialIds
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Onboarding routes
  app.post("/api/onboarding/complete", requireAuth, async (req, res, next) => {
    try {
      const updated = await storage.completeOnboarding(req.user!.id);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...sanitized } = updated;
      res.json(sanitized);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
