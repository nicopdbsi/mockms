import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, crypto } from "./auth";
import passport from "passport";
import { insertUserSchema, insertSupplierSchema, insertIngredientSchema, insertMaterialSchema, insertRecipeSchema, insertOrderSchema, insertIngredientCategorySchema, insertMaterialCategorySchema } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
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
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
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
      req.login(user, (err) => {
        if (err) return next(err);
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
        req.body
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
      const recipe = await storage.getRecipe(req.params.id, req.user!.id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      const ingredients = await storage.getRecipeIngredients(req.params.id);
      res.json({ ...recipe, ingredients });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/recipes", requireAuth, async (req, res, next) => {
    try {
      const { ingredients, ...recipeData } = req.body;
      const data = insertRecipeSchema.parse({
        ...recipeData,
        userId: req.user!.id,
      });
      const recipe = await storage.createRecipe(data);
      
      if (ingredients && Array.isArray(ingredients)) {
        for (const ing of ingredients) {
          await storage.createRecipeIngredient({
            recipeId: recipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          });
        }
      }
      
      const recipeIngredients = await storage.getRecipeIngredients(recipe.id);
      res.json({ ...recipe, ingredients: recipeIngredients });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/recipes/:id", requireAuth, async (req, res, next) => {
    try {
      const { ingredients, ...recipeData } = req.body;
      const recipe = await storage.updateRecipe(
        req.params.id,
        req.user!.id,
        recipeData
      );
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      if (ingredients && Array.isArray(ingredients)) {
        await storage.deleteRecipeIngredientsByRecipe(req.params.id);
        for (const ing of ingredients) {
          await storage.createRecipeIngredient({
            recipeId: recipe.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
          });
        }
      }

      const recipeIngredients = await storage.getRecipeIngredients(recipe.id);
      res.json({ ...recipe, ingredients: recipeIngredients });
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

  const httpServer = createServer(app);
  return httpServer;
}
