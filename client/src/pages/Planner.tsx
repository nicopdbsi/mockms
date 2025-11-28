import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Trash2, Edit2, CheckCircle, XCircle, PlayCircle, Eye } from "lucide-react";
import type { Recipe, PlannerEntry } from "@shared/schema";

type PlannerEntryWithRecipe = PlannerEntry & { recipe: Recipe };

const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels: Record<string, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Planner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PlannerEntryWithRecipe | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const [formData, setFormData] = useState({
    recipeId: "",
    scheduledStart: "",
    scheduledTime: "09:00",
    batchQuantity: 1,
    status: "planned",
    notes: "",
  });

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  const { data: entries, isLoading: entriesLoading } = useQuery<PlannerEntryWithRecipe[]>({
    queryKey: ["/api/planner", { start: start.toISOString(), end: end.toISOString() }],
    queryFn: async () => {
      const res = await fetch(`/api/planner?start=${start.toISOString()}&end=${end.toISOString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch planner entries");
      return res.json();
    },
  });

  const { data: recipes, isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/planner", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner"] });
      toast({ title: "Success", description: "Recipe scheduled successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule recipe", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/planner/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner"] });
      toast({ title: "Success", description: "Schedule updated successfully" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update schedule", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/planner/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planner"] });
      toast({ title: "Success", description: "Schedule deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete schedule", variant: "destructive" });
    },
  });

  const days = useMemo(() => {
    return eachDayOfInterval({ start, end });
  }, [start, end]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, PlannerEntryWithRecipe[]>();
    entries?.forEach((entry) => {
      const dateKey = format(parseISO(entry.scheduledStart as unknown as string), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(entry);
    });
    return map;
  }, [entries]);

  const handleOpenDialog = (date?: Date, entry?: PlannerEntryWithRecipe) => {
    if (entry) {
      setEditingEntry(entry);
      const scheduledDate = parseISO(entry.scheduledStart as unknown as string);
      setFormData({
        recipeId: entry.recipeId,
        scheduledStart: format(scheduledDate, "yyyy-MM-dd"),
        scheduledTime: format(scheduledDate, "HH:mm"),
        batchQuantity: entry.batchQuantity,
        status: entry.status,
        notes: entry.notes || "",
      });
    } else {
      setEditingEntry(undefined);
      setFormData({
        recipeId: "",
        scheduledStart: date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        scheduledTime: "09:00",
        batchQuantity: 1,
        status: "planned",
        notes: "",
      });
    }
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntry(undefined);
    setSelectedDate(undefined);
  };

  const handleSubmit = () => {
    if (!formData.recipeId || !formData.scheduledStart) {
      toast({ title: "Error", description: "Please select a recipe and date", variant: "destructive" });
      return;
    }

    const scheduledStart = new Date(`${formData.scheduledStart}T${formData.scheduledTime}`);

    const data = {
      recipeId: formData.recipeId,
      scheduledStart: scheduledStart.toISOString(),
      batchQuantity: formData.batchQuantity,
      status: formData.status,
      notes: formData.notes || null,
    };

    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStatusChange = (entry: PlannerEntryWithRecipe, newStatus: string) => {
    updateMutation.mutate({ id: entry.id, data: { status: newStatus } });
  };

  const sortedRecipes = useMemo(() => {
    if (!recipes) return [];
    return [...recipes].sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayOfMonth = start.getDay();
  const paddedDays = Array(firstDayOfMonth).fill(null);

  if (entriesLoading || recipesLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">
              Production Planner
            </h1>
            <p className="text-muted-foreground">
              Schedule your recipes and track production
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-schedule-recipe">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Recipe
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold" data-testid="text-current-month">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="button-today"
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {paddedDays.map((_, index) => (
                <div key={`pad-${index}`} className="bg-background min-h-24 p-1" />
              ))}
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEntries = entriesByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={dateKey}
                    className={`bg-background min-h-24 p-1 border-t cursor-pointer hover-elevate ${
                      !isCurrentMonth ? "opacity-50" : ""
                    } ${isTodayDate ? "ring-2 ring-primary ring-inset" : ""}`}
                    onClick={() => handleOpenDialog(day)}
                    data-testid={`calendar-day-${dateKey}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isTodayDate ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <div
                          key={entry.id}
                          className={`text-xs p-1 rounded truncate ${statusColors[entry.status]}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(day, entry);
                          }}
                          data-testid={`entry-${entry.id}`}
                        >
                          {entry.recipe.name}
                          {entry.batchQuantity > 1 && ` (×${entry.batchQuantity})`}
                        </div>
                      ))}
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEntries.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Your planned production for this month</CardDescription>
          </CardHeader>
          <CardContent>
            {entries && entries.length > 0 ? (
              <div className="space-y-3">
                {entries
                  .filter((e) => e.status !== "cancelled")
                  .map((entry) => {
                    const scheduledDate = parseISO(entry.scheduledStart as unknown as string);
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                        data-testid={`schedule-item-${entry.id}`}
                      >
                        <div className="flex items-center gap-4">
                          {entry.recipe.coverImage ? (
                            <img
                              src={entry.recipe.coverImage}
                              alt={entry.recipe.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{entry.recipe.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(scheduledDate, "EEE, MMM d")}
                              <Clock className="h-3 w-3 ml-2" />
                              {format(scheduledDate, "h:mm a")}
                              {entry.batchQuantity > 1 && (
                                <span className="ml-2">× {entry.batchQuantity} batches</span>
                              )}
                            </div>
                            {entry.notes && (
                              <div className="text-xs text-muted-foreground mt-1">{entry.notes}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[entry.status]}>
                            {statusLabels[entry.status]}
                          </Badge>
                          <Select
                            value={entry.status}
                            onValueChange={(value) => handleStatusChange(entry, value)}
                          >
                            <SelectTrigger className="w-9 h-9 p-0" data-testid={`select-status-${entry.id}`}>
                              <SelectValue>
                                {entry.status === "planned" && <PlayCircle className="h-4 w-4" />}
                                {entry.status === "in_progress" && <Clock className="h-4 w-4" />}
                                {entry.status === "completed" && <CheckCircle className="h-4 w-4" />}
                                {entry.status === "cancelled" && <XCircle className="h-4 w-4" />}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(undefined, entry)}
                            data-testid={`button-edit-${entry.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(entry.id)}
                            data-testid={`button-delete-${entry.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg border-dashed" data-testid="empty-state-planner">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No recipes scheduled for this month. Click on a date or "Schedule Recipe" to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit Schedule" : "Schedule Recipe"}
              </DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update your scheduled production"
                  : "Add a recipe to your production schedule"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="recipe">Recipe</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={formData.recipeId}
                      onValueChange={(value) => setFormData({ ...formData, recipeId: value })}
                    >
                      <SelectTrigger data-testid="select-recipe">
                        <SelectValue placeholder="Select a recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedRecipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.recipeId && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/recipes/${formData.recipeId}`)}
                      data-testid="button-view-recipe"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                    data-testid="input-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    data-testid="input-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchQuantity">Number of Batches</Label>
                <Input
                  id="batchQuantity"
                  type="number"
                  min="1"
                  value={formData.batchQuantity}
                  onChange={(e) => setFormData({ ...formData, batchQuantity: parseInt(e.target.value) || 1 })}
                  data-testid="input-batch-quantity"
                />
              </div>

              {editingEntry && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for this production..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="input-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingEntry
                  ? "Update"
                  : "Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
