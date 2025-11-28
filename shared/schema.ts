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
  firstName: text("first_name"),
  businessName: text("business_name"),
  role: text("role").notNull().default("regular"),
  plan: text("plan").default("Hobby").notNull(),
  currency: text("currency").default("USD").notNull(),
  timezone: text("timezone").default("UTC").notNull(),
  status: text("status").default("active").notNull(),
  lastLogin: timestamp("last_login"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false).notNull(),
  starterPackImportedAt: timestamp("starter_pack_imported_at"),
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
  isCountBased: boolean("is_count_based").default(false),
  purchaseUnit: text("purchase_unit"),
  piecesPerPurchaseUnit: numeric("pieces_per_purchase_unit", { precision: 10, scale: 2 }),
  weightPerPiece: numeric("weight_per_piece", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }),
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
  category: text("category"),
  coverImage: text("cover_image"),
  servings: integer("servings").default(1).notNull(),
  targetMargin: numeric("target_margin", { precision: 5, scale: 2 }).default("50"),
  targetFoodCost: numeric("target_food_cost", { precision: 5, scale: 2 }).default("30"),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).default("0"),
  batchYield: integer("batch_yield").default(1),
  procedures: text("procedures"),
  standardYieldPieces: integer("standard_yield_pieces"),
  standardYieldWeightPerPiece: numeric("standard_yield_weight_per_piece", { precision: 10, scale: 2 }),
  standardPanSize: text("standard_pan_size"),
  standardNumTrays: integer("standard_num_trays"),
  isFreeRecipe: boolean("is_free_recipe").default(false).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  accessType: text("access_type").default("all"),
  allowedPlans: text("allowed_plans"),
  allowedUserEmails: text("allowed_user_emails"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipeId: varchar("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: varchar("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  componentName: text("component_name").default("Main"),
  unit: text("unit").default("g"),
  order: integer("order").default(0).notNull(),
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

// Starter Pack Tables (Admin-managed templates)
export const starterIngredients = pgTable("starter_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category"),
  pricePerGram: numeric("price_per_gram", { precision: 10, scale: 4 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).default("0").notNull(),
  unit: text("unit").notNull(),
  purchaseAmount: numeric("purchase_amount", { precision: 10, scale: 2 }),
  isCountBased: boolean("is_count_based").default(false),
  purchaseUnit: text("purchase_unit"),
  piecesPerPurchaseUnit: numeric("pieces_per_purchase_unit", { precision: 10, scale: 2 }),
  weightPerPiece: numeric("weight_per_piece", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const starterMaterials = pgTable("starter_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }),
  purchaseAmount: numeric("purchase_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const starterIngredientCategories = pgTable("starter_ingredient_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const starterMaterialCategories = pgTable("starter_material_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
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

// Zod Schemas

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertRecipeMaterialSchema = createInsertSchema(recipeMaterials).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertIngredientCategorySchema = createInsertSchema(ingredientCategories).omit({ id: true, createdAt: true });
export const insertMaterialCategorySchema = createInsertSchema(materialCategories).omit({ id: true, createdAt: true });
export const insertStarterIngredientSchema = createInsertSchema(starterIngredients).omit({ id: true, createdAt: true });
export const insertStarterMaterialSchema = createInsertSchema(starterMaterials).omit({ id: true, createdAt: true });
export const insertStarterIngredientCategorySchema = createInsertSchema(starterIngredientCategories).omit({ id: true, createdAt: true });
export const insertStarterMaterialCategorySchema = createInsertSchema(starterMaterialCategories).omit({ id: true, createdAt: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type RecipeMaterial = typeof recipeMaterials.$inferSelect;
export type InsertRecipeMaterial = z.infer<typeof insertRecipeMaterialSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type IngredientCategory = typeof ingredientCategories.$inferSelect;
export type InsertIngredientCategory = z.infer<typeof insertIngredientCategorySchema>;
export type MaterialCategory = typeof materialCategories.$inferSelect;
export type InsertMaterialCategory = z.infer<typeof insertMaterialCategorySchema>;
export type StarterIngredient = typeof starterIngredients.$inferSelect;
export type InsertStarterIngredient = z.infer<typeof insertStarterIngredientSchema>;
export type StarterMaterial = typeof starterMaterials.$inferSelect;
export type InsertStarterMaterial = z.infer<typeof insertStarterMaterialSchema>;
export type StarterIngredientCategory = typeof starterIngredientCategories.$inferSelect;
export type InsertStarterIngredientCategory = z.infer<typeof insertStarterIngredientCategorySchema>;
export type StarterMaterialCategory = typeof starterMaterialCategories.$inferSelect;
export type InsertStarterMaterialCategory = z.infer<typeof insertStarterMaterialCategorySchema>;
