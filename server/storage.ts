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
  type Order,
  type InsertOrder,
  users,
  suppliers,
  ingredients,
  materials,
  recipes,
  recipeIngredients,
  orders
} from "@shared/schema";
import { db } from "../db/index";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  
  getMaterials(userId: string): Promise<Material[]>;
  getMaterial(id: string, userId: string): Promise<Material | undefined>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, userId: string, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: string, userId: string): Promise<boolean>;
  
  getRecipes(userId: string): Promise<Recipe[]>;
  getRecipe(id: string, userId: string): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: string, userId: string, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string, userId: string): Promise<boolean>;
  
  getRecipeIngredients(recipeId: string): Promise<(RecipeIngredient & { ingredient: Ingredient })[]>;
  createRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  deleteRecipeIngredient(id: string): Promise<boolean>;
  deleteRecipeIngredientsByRecipe(recipeId: string): Promise<void>;
  
  getOrders(userId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByRecipe(recipeId: string, userId: string): Promise<Order[]>;
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
      ingredient: ingredients,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipeId));
    
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
}

export const storage = new DbStorage();
