import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  businessName: text("business_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  pricePerGram: numeric("price_per_gram", { precision: 10, scale: 4 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("0").notNull(),
  unit: text("unit").notNull(),
  purchaseAmount: numeric("purchase_amount", { precision: 10, scale: 2 }),
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("0").notNull(),
  unit: text("unit").notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  purchaseAmount: numeric("purchase_amount", { precision: 10, scale: 2 }),
  supplierId: varchar("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").default(1).notNull(),
  targetMargin: numeric("target_margin", { precision: 5, scale: 2 }).default("50"),
  targetFoodCost: numeric("target_food_cost", { precision: 5, scale: 2 }).default("30"),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).default("0"),
  batchYield: integer("batch_yield").default(1),
  procedures: text("procedures"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: varchar("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  componentName: text("component_name").default("Main"),
});

export const recipeMaterials = pgTable("recipe_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  materialId: varchar("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  totalRevenue: numeric("total_revenue", { precision: 10, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ingredientCategories = pgTable("ingredient_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materialCategories = pgTable("material_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ingredientCategoriesRelations = relations(ingredientCategories, ({ one }) => ({
  user: one(users, {
    fields: [ingredientCategories.userId],
    references: [users.id],
  }),
}));

export const materialCategoriesRelations = relations(materialCategories, ({ one }) => ({
  user: one(users, {
    fields: [materialCategories.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  ingredients: many(ingredients),
  recipes: many(recipes),
  orders: many(orders),
  suppliers: many(suppliers),
  materials: many(materials),
  ingredientCategories: many(ingredientCategories),
  materialCategories: many(materialCategories),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
  ingredients: many(ingredients),
  materials: many(materials),
}));

export const ingredientsRelations = relations(ingredients, ({ one, many }) => ({
  user: one(users, {
    fields: [ingredients.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [ingredients.supplierId],
    references: [suppliers.id],
  }),
  recipeIngredients: many(recipeIngredients),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [materials.supplierId],
    references: [suppliers.id],
  }),
  recipeMaterials: many(recipeMaterials),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  recipeIngredients: many(recipeIngredients),
  recipeMaterials: many(recipeMaterials),
  orders: many(orders),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const recipeMaterialsRelations = relations(recipeMaterials, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeMaterials.recipeId],
    references: [recipes.id],
  }),
  material: one(materials, {
    fields: [recipeMaterials.materialId],
    references: [materials.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [orders.recipeId],
    references: [recipes.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  businessName: createInsertSchema(users).shape.businessName.optional(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export const insertRecipeMaterialSchema = createInsertSchema(recipeMaterials).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertIngredientCategorySchema = createInsertSchema(ingredientCategories).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialCategorySchema = createInsertSchema(materialCategories).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;

export type InsertRecipeMaterial = z.infer<typeof insertRecipeMaterialSchema>;
export type RecipeMaterial = typeof recipeMaterials.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertIngredientCategory = z.infer<typeof insertIngredientCategorySchema>;
export type IngredientCategory = typeof ingredientCategories.$inferSelect;

export type InsertMaterialCategory = z.infer<typeof insertMaterialCategorySchema>;
export type MaterialCategory = typeof materialCategories.$inferSelect;
