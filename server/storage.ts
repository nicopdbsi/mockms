import { 
  type User, 
  type InsertUser,
  type Supplier,
  type InsertSupplier,
  type Ingredient,
  type InsertIngredient,
  type Material,
  type InsertMaterial,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type RecipeMaterial,
  type InsertRecipeMaterial,
  type Order,
  type InsertOrder,
  type IngredientCategory,
  type InsertIngredientCategory,
  type MaterialCategory,
  type InsertMaterialCategory,
  type StarterIngredient,
  type InsertStarterIngredient,
  type StarterMaterial,
  type InsertStarterMaterial,
  users,
  suppliers,
  ingredients,
  materials,
  recipes,
  recipeIngredients,
  recipeMaterials,
  orders,
  ingredientCategories,
  materialCategories,
  starterIngredients,
  starterMaterials
} from "@shared/schema";
import { db } from "../db/index";
import { eq, and, desc, sql, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserSettings(id: string, currency: string, timezone: string): Promise<User | undefined>;
  updateUserCredentials(id: string, username: string, password: string): Promise<User | undefined>;
  
  getSuppliers(userId: string): Promise<Supplier[]>;
  getSupplier(id: string, userId: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, userId: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string, userId: string): Promise<boolean>;
  
  getIngredients(userId: string): Promise<Ingredient[]>;
  getIngredient(id: string, userId: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, userId: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: string, userId: string): Promise<boolean>;
  getRecipesByIngredient(ingredientId: string, userId: string): Promise<Recipe[]>;
  
  getMaterials(userId: string): Promise<Material[]>;
  getMaterial(id: string, userId: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, userId: string, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: string, userId: string): Promise<boolean>;
  
  getRecipes(userId: string): Promise<Recipe[]>;
  getRecipe(id: string, userId: string): Promise<Recipe | undefined>;
  getRecipeWithAccess(id: string, userId: string, userEmail?: string, userPlan?: string, userRole?: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, userId: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string, userId: string): Promise<boolean>;
  
  getRecipeIngredients(recipeId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]>;
  createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  deleteRecipeIngredient(id: string): Promise<boolean>;
  deleteRecipeIngredientsByRecipe(recipeId: string): Promise<void>;
  
  getRecipeMaterials(recipeId: string): Promise<(RecipeMaterial & { material: Material })[]>;
  createRecipeMaterial(recipeMaterial: InsertRecipeMaterial): Promise<RecipeMaterial>;
  deleteRecipeMaterial(id: string): Promise<boolean>;
  deleteRecipeMaterialsByRecipe(recipeId: string): Promise<void>;
  
  getOrders(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByRecipe(recipeId: string, userId: string): Promise<Order[]>;
  
  getIngredientCategories(userId: string): Promise<IngredientCategory[]>;
  createIngredientCategory(category: InsertIngredientCategory): Promise<IngredientCategory>;
  updateIngredientCategory(id: string, userId: string, name: string): Promise<IngredientCategory | undefined>;
  deleteIngredientCategory(id: string, userId: string): Promise<boolean>;
  
  getMaterialCategories(userId: string): Promise<MaterialCategory[]>;
  createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory>;
  updateMaterialCategory(id: string, userId: string, name: string): Promise<MaterialCategory | undefined>;
  deleteMaterialCategory(id: string, userId: string): Promise<boolean>;
  
  // Starter Pack (Admin-managed templates)
  getStarterIngredients(): Promise<StarterIngredient[]>;
  getStarterIngredient(id: string): Promise<StarterIngredient | undefined>;
  createStarterIngredient(ingredient: InsertStarterIngredient): Promise<StarterIngredient>;
  updateStarterIngredient(id: string, ingredient: Partial<InsertStarterIngredient>): Promise<StarterIngredient | undefined>;
  deleteStarterIngredient(id: string): Promise<boolean>;
  
  getStarterMaterials(): Promise<StarterMaterial[]>;
  getStarterMaterial(id: string): Promise<StarterMaterial | undefined>;
  createStarterMaterial(material: InsertStarterMaterial): Promise<StarterMaterial>;
  updateStarterMaterial(id: string, material: Partial<InsertStarterMaterial>): Promise<StarterMaterial | undefined>;
  deleteStarterMaterial(id: string): Promise<boolean>;
  
  // Import starter pack to user's inventory
  importStarterPack(userId: string, ingredientIds: string[], materialIds: string[]): Promise<{ importedIngredients: number; importedMaterials: number; skippedDuplicates: number }>;
  
  // Onboarding
  completeOnboarding(userId: string): Promise<User | undefined>;
  markStarterPackImported(userId: string): Promise<User | undefined>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0]?.count || 0);
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async updateUserSettings(id: string, currency: string, timezone: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ currency, timezone })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserCredentials(id: string, username: string, password: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ username, password })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateLastLogin(id: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateUserStatus(id: string, status: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAdminStats(): Promise<any> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const allUsers = await db.select().from(users);
    const activeUsers7d = allUsers.filter(u => u.lastLogin && new Date(u.lastLogin) > sevenDaysAgo).length;
    const activeUsers30d = allUsers.filter(u => u.lastLogin && new Date(u.lastLogin) > thirtyDaysAgo).length;
    const newSignupsToday = allUsers.filter(u => new Date(u.createdAt) > todayStart).length;
    const totalRecipes = await db.select({ count: sql`count(*)` }).from(recipes);
    
    return {
      totalUsers: allUsers.length,
      activeUsers7d,
      activeUsers30d,
      newSignupsToday,
      trialUsers: allUsers.filter(u => u.role === 'beta_tester').length,
      totalRecipes: Number(totalRecipes[0]?.count || 0),
    };
  }

  async getSuppliers(userId: string): Promise<Supplier[]> {
    return db.select().from(suppliers).where(eq(suppliers.userId, userId)).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string, userId: string): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(supplier).returning();
    return result[0];
  }

  async updateSupplier(id: string, userId: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers)
      .set(supplier)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getIngredients(userId: string): Promise<Ingredient[]> {
    return db.select().from(ingredients).where(eq(ingredients.userId, userId));
  }

  async getIngredient(id: string, userId: string): Promise<Ingredient | undefined> {
    const result = await db.select().from(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const result = await db.insert(ingredients).values(ingredient).returning();
    return result[0];
  }

  async updateIngredient(id: string, userId: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const result = await db.update(ingredients)
      .set(ingredient)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteIngredient(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(ingredients)
      .where(and(eq(ingredients.id, id), eq(ingredients.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getRecipesByIngredient(ingredientId: string, userId: string): Promise<Recipe[]> {
    const result = await db.select().from(recipes)
      .innerJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .where(and(eq(recipeIngredients.ingredientId, ingredientId), eq(recipes.userId, userId)));
    return result.map(r => r.recipes);
  }

  async getFreeRecipes(userId?: string, userEmail?: string, userPlan?: string, userRole?: string): Promise<Recipe[]> {
    const allFreeRecipes = await db.select().from(recipes).where(and(eq(recipes.isFreeRecipe, true), eq(recipes.isVisible, true)));
    
    // If no user info provided, return only "all" access type recipes
    if (!userId) {
      return allFreeRecipes.filter(r => r.accessType === "all");
    }
    
    // Filter recipes based on access controls
    return allFreeRecipes.filter(recipe => {
      // Own recipes (created by this user)
      if (recipe.userId === userId) {
        return true;
      }
      
      switch (recipe.accessType) {
        case "admin":
          // Only visible to admin users
          return userRole === "admin";
        
        case "all":
          // Visible to everyone
          return true;
        
        case "by-plan":
          // Visible to users with specific plans
          if (!userPlan || !recipe.allowedPlans) return false;
          const allowedPlans = recipe.allowedPlans.split(",").map(p => p.trim());
          return allowedPlans.includes(userPlan);
        
        case "selected-users":
          // Visible to specific email addresses
          if (!userEmail || !recipe.allowedUserEmails) return false;
          const allowedEmails = recipe.allowedUserEmails.split(",").map(e => e.trim().toLowerCase());
          return allowedEmails.includes(userEmail.toLowerCase());
        
        default:
          return false;
      }
    });
  }

  async findIngredientByName(userId: string, name: string): Promise<Ingredient | undefined> {
    const result = await db.select().from(ingredients)
      .where(and(eq(ingredients.userId, userId), ilike(ingredients.name, name)))
      .limit(1);
    return result[0];
  }

  async findMaterialByName(userId: string, name: string): Promise<Material | undefined> {
    const result = await db.select().from(materials)
      .where(and(eq(materials.userId, userId), ilike(materials.name, name)))
      .limit(1);
    return result[0];
  }

  async cloneRecipe(recipeId: string, newUserId: string): Promise<Recipe | undefined> {
    const original = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
    if (!original[0]) return undefined;
    
    const { id, userId, isFreeRecipe, isVisible, accessType, allowedPlans, allowedUserEmails, ...data } = original[0];
    const cloned = await db.insert(recipes).values({
      ...data,
      userId: newUserId,
      isFreeRecipe: false,
      isVisible: true,
      accessType: 'all',
    }).returning();
    
    if (!cloned[0]) return undefined;
    const clonedRecipeId = cloned[0].id;
    
    // Fetch original recipe's ingredients with their details
    const originalIngredients = await this.getRecipeIngredients(recipeId);
    
    // Clone each ingredient association
    for (const recipeIng of originalIngredients) {
      const originalIngredient = recipeIng.ingredient;
      
      // Check if user already has an ingredient with the same name (case-insensitive)
      let userIngredient = await this.findIngredientByName(newUserId, originalIngredient.name);
      
      // If not found, create a copy of the ingredient for this user
      if (!userIngredient) {
        const { id: ingId, userId: ingUserId, supplierId, createdAt, ...ingredientData } = originalIngredient;
        userIngredient = await this.createIngredient({
          ...ingredientData,
          userId: newUserId,
          supplierId: null, // Don't copy supplier reference
        });
      }
      
      // Create the recipe-ingredient association
      await this.createRecipeIngredient({
        recipeId: clonedRecipeId,
        ingredientId: userIngredient.id,
        quantity: recipeIng.quantity,
        componentName: recipeIng.componentName,
        unit: recipeIng.unit,
        order: recipeIng.order,
      });
    }
    
    // Fetch original recipe's materials with their details
    const originalMaterials = await this.getRecipeMaterials(recipeId);
    
    // Clone each material association
    for (const recipeMat of originalMaterials) {
      const originalMaterial = recipeMat.material;
      
      // Check if user already has a material with the same name (case-insensitive)
      let userMaterial = await this.findMaterialByName(newUserId, originalMaterial.name);
      
      // If not found, create a copy of the material for this user
      if (!userMaterial) {
        const { id: matId, userId: matUserId, supplierId, createdAt, ...materialData } = originalMaterial;
        userMaterial = await this.createMaterial({
          ...materialData,
          userId: newUserId,
          supplierId: null, // Don't copy supplier reference
        });
      }
      
      // Create the recipe-material association
      await this.createRecipeMaterial({
        recipeId: clonedRecipeId,
        materialId: userMaterial.id,
        quantity: recipeMat.quantity,
      });
    }
    
    return cloned[0];
  }

  async updateRecipeFreeStatus(id: string, userId: string, isFree: boolean, accessType: string, allowedPlans?: string, allowedUserEmails?: string): Promise<Recipe | undefined> {
    const result = await db.update(recipes)
      .set({ isFreeRecipe: isFree, accessType, allowedPlans, allowedUserEmails })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return result[0];
  }

  async toggleRecipeVisibility(id: string, userId: string, isVisible: boolean): Promise<Recipe | undefined> {
    const result = await db.update(recipes)
      .set({ isVisible })
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId), eq(recipes.isFreeRecipe, true)))
      .returning();
    return result[0];
  }

  async getMaterials(userId: string): Promise<Material[]> {
    return db.select().from(materials).where(eq(materials.userId, userId)).orderBy(desc(materials.createdAt));
  }

  async getMaterial(id: string, userId: string): Promise<Material | undefined> {
    const result = await db.select().from(materials)
      .where(and(eq(materials.id, id), eq(materials.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const result = await db.insert(materials).values(material).returning();
    return result[0];
  }

  async updateMaterial(id: string, userId: string, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const result = await db.update(materials)
      .set(material)
      .where(and(eq(materials.id, id), eq(materials.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteMaterial(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(materials)
      .where(and(eq(materials.id, id), eq(materials.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getRecipes(userId: string): Promise<Recipe[]> {
    return db.select().from(recipes).where(eq(recipes.userId, userId)).orderBy(desc(recipes.createdAt));
  }

  async getRecipe(id: string, userId: string): Promise<Recipe | undefined> {
    const result = await db.select().from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .limit(1);
    return result[0];
  }

  async getRecipeWithAccess(id: string, userId: string, userEmail?: string, userPlan?: string, userRole?: string): Promise<Recipe | undefined> {
    const result = await db.select().from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);
    
    const recipe = result[0];
    if (!recipe) return undefined;
    
    // If user owns this recipe, they can access it
    if (recipe.userId === userId) {
      return recipe;
    }
    
    // If it's a free recipe and visible, check access control
    if (recipe.isFreeRecipe && recipe.isVisible) {
      switch (recipe.accessType) {
        case "admin":
          // Only visible to admin users
          if (userRole === "admin") return recipe;
          break;
        
        case "all":
          // Visible to everyone
          return recipe;
        
        case "by-plan":
          // Visible to users with specific plans
          if (userPlan && recipe.allowedPlans) {
            const allowedPlans = recipe.allowedPlans.split(",").map(p => p.trim());
            if (allowedPlans.includes(userPlan)) return recipe;
          }
          break;
        
        case "selected-users":
          // Visible to specific email addresses
          if (userEmail && recipe.allowedUserEmails) {
            const allowedEmails = recipe.allowedUserEmails.split(",").map(e => e.trim().toLowerCase());
            if (allowedEmails.includes(userEmail.toLowerCase())) return recipe;
          }
          break;
      }
    }
    
    return undefined;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const result = await db.insert(recipes).values(recipe).returning();
    return result[0];
  }

  async updateRecipe(id: string, userId: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const result = await db.update(recipes)
      .set(recipe)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getRecipeIngredients(recipeId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]> {
    const result = await db.select({
      id: recipeIngredients.id,
      recipeId: recipeIngredients.recipeId,
      ingredientId: recipeIngredients.ingredientId,
      quantity: recipeIngredients.quantity,
      componentName: recipeIngredients.componentName,
      unit: recipeIngredients.unit,
      order: recipeIngredients.order,
      ingredient: ingredients,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipeId))
    .orderBy(recipeIngredients.order);
    
    return result;
  }

  async createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const result = await db.insert(recipeIngredients).values(recipeIngredient).returning();
    return result[0];
  }

  async deleteRecipeIngredient(id: string): Promise<boolean> {
    const result = await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id)).returning();
    return result.length > 0;
  }

  async deleteRecipeIngredientsByRecipe(recipeId: string): Promise<void> {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  }

  async getRecipeMaterials(recipeId: string): Promise<(RecipeMaterial & { material: Material })[]> {
    const result = await db.select({
      id: recipeMaterials.id,
      recipeId: recipeMaterials.recipeId,
      materialId: recipeMaterials.materialId,
      quantity: recipeMaterials.quantity,
      material: materials,
    })
    .from(recipeMaterials)
    .innerJoin(materials, eq(recipeMaterials.materialId, materials.id))
    .where(eq(recipeMaterials.recipeId, recipeId));
    
    return result;
  }

  async createRecipeMaterial(recipeMaterial: InsertRecipeMaterial): Promise<RecipeMaterial> {
    const result = await db.insert(recipeMaterials).values(recipeMaterial).returning();
    return result[0];
  }

  async deleteRecipeMaterial(id: string): Promise<boolean> {
    const result = await db.delete(recipeMaterials).where(eq(recipeMaterials.id, id)).returning();
    return result.length > 0;
  }

  async deleteRecipeMaterialsByRecipe(recipeId: string): Promise<void> {
    await db.delete(recipeMaterials).where(eq(recipeMaterials.recipeId, recipeId));
  }

  async getOrders(userId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  }

  async getOrdersByRecipe(recipeId: string, userId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(and(eq(orders.recipeId, recipeId), eq(orders.userId, userId)))
      .orderBy(desc(orders.createdAt));
  }

  async getIngredientCategories(userId: string): Promise<IngredientCategory[]> {
    return db.select().from(ingredientCategories)
      .where(eq(ingredientCategories.userId, userId))
      .orderBy(ingredientCategories.name);
  }

  async createIngredientCategory(category: InsertIngredientCategory): Promise<IngredientCategory> {
    const result = await db.insert(ingredientCategories).values(category).returning();
    return result[0];
  }

  async updateIngredientCategory(id: string, userId: string, name: string): Promise<IngredientCategory | undefined> {
    const result = await db.update(ingredientCategories)
      .set({ name })
      .where(and(eq(ingredientCategories.id, id), eq(ingredientCategories.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteIngredientCategory(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(ingredientCategories)
      .where(and(eq(ingredientCategories.id, id), eq(ingredientCategories.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getMaterialCategories(userId: string): Promise<MaterialCategory[]> {
    return db.select().from(materialCategories)
      .where(eq(materialCategories.userId, userId))
      .orderBy(materialCategories.name);
  }

  async createMaterialCategory(category: InsertMaterialCategory): Promise<MaterialCategory> {
    const result = await db.insert(materialCategories).values(category).returning();
    return result[0];
  }

  async updateMaterialCategory(id: string, userId: string, name: string): Promise<MaterialCategory | undefined> {
    const result = await db.update(materialCategories)
      .set({ name })
      .where(and(eq(materialCategories.id, id), eq(materialCategories.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteMaterialCategory(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(materialCategories)
      .where(and(eq(materialCategories.id, id), eq(materialCategories.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Starter Pack Methods (Admin-managed templates)
  async getStarterIngredients(): Promise<StarterIngredient[]> {
    return db.select().from(starterIngredients).orderBy(starterIngredients.name);
  }

  async getStarterIngredient(id: string): Promise<StarterIngredient | undefined> {
    const result = await db.select().from(starterIngredients)
      .where(eq(starterIngredients.id, id))
      .limit(1);
    return result[0];
  }

  async createStarterIngredient(ingredient: InsertStarterIngredient): Promise<StarterIngredient> {
    const result = await db.insert(starterIngredients).values(ingredient).returning();
    return result[0];
  }

  async updateStarterIngredient(id: string, ingredient: Partial<InsertStarterIngredient>): Promise<StarterIngredient | undefined> {
    const result = await db.update(starterIngredients)
      .set(ingredient)
      .where(eq(starterIngredients.id, id))
      .returning();
    return result[0];
  }

  async deleteStarterIngredient(id: string): Promise<boolean> {
    const result = await db.delete(starterIngredients)
      .where(eq(starterIngredients.id, id))
      .returning();
    return result.length > 0;
  }

  async getStarterMaterials(): Promise<StarterMaterial[]> {
    return db.select().from(starterMaterials).orderBy(starterMaterials.name);
  }

  async getStarterMaterial(id: string): Promise<StarterMaterial | undefined> {
    const result = await db.select().from(starterMaterials)
      .where(eq(starterMaterials.id, id))
      .limit(1);
    return result[0];
  }

  async createStarterMaterial(material: InsertStarterMaterial): Promise<StarterMaterial> {
    const result = await db.insert(starterMaterials).values(material).returning();
    return result[0];
  }

  async updateStarterMaterial(id: string, material: Partial<InsertStarterMaterial>): Promise<StarterMaterial | undefined> {
    const result = await db.update(starterMaterials)
      .set(material)
      .where(eq(starterMaterials.id, id))
      .returning();
    return result[0];
  }

  async deleteStarterMaterial(id: string): Promise<boolean> {
    const result = await db.delete(starterMaterials)
      .where(eq(starterMaterials.id, id))
      .returning();
    return result.length > 0;
  }

  async importStarterPack(userId: string, ingredientIds: string[], materialIds: string[]): Promise<{ importedIngredients: number; importedMaterials: number; skippedDuplicates: number }> {
    let importedIngredients = 0;
    let importedMaterials = 0;
    let skippedDuplicates = 0;

    // Import selected starter ingredients
    for (const starterId of ingredientIds) {
      const starterIng = await this.getStarterIngredient(starterId);
      if (!starterIng) continue;

      // Check if user already has an ingredient with the same name
      const existing = await this.findIngredientByName(userId, starterIng.name);
      if (existing) {
        skippedDuplicates++;
        continue;
      }

      // Create a copy for the user
      const { id, createdAt, ...ingredientData } = starterIng;
      await this.createIngredient({
        ...ingredientData,
        userId,
        supplierId: null,
      });
      importedIngredients++;
    }

    // Import selected starter materials
    for (const starterId of materialIds) {
      const starterMat = await this.getStarterMaterial(starterId);
      if (!starterMat) continue;

      // Check if user already has a material with the same name
      const existing = await this.findMaterialByName(userId, starterMat.name);
      if (existing) {
        skippedDuplicates++;
        continue;
      }

      // Create a copy for the user
      const { id, createdAt, ...materialData } = starterMat;
      await this.createMaterial({
        ...materialData,
        userId,
        supplierId: null,
      });
      importedMaterials++;
    }

    // Mark that user has imported starter pack
    await this.markStarterPackImported(userId);

    return { importedIngredients, importedMaterials, skippedDuplicates };
  }

  async completeOnboarding(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ hasCompletedOnboarding: true })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async markStarterPackImported(userId: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ starterPackImportedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
