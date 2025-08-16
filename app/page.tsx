"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { toast } from "@/hooks/use-toast"
import { X, Save, History, Trash2, DollarSign } from "lucide-react"

interface BudgetCategory {
  id: string
  name: string
  allocated: number
  spent: number
  color: string
}

interface SavedTracker {
  id: string
  name: string
  date: string
  totalBudget: number
  currency: string
  categories: BudgetCategory[]
}

const currencies = [
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
]

const initialCategories: BudgetCategory[] = [
  { id: "1", name: "Food & Groceries", allocated: 0, spent: 0, color: "#3b82f6" },
  { id: "2", name: "Transportation", allocated: 0, spent: 0, color: "#10b981" },
  { id: "3", name: "Utilities", allocated: 0, spent: 0, color: "#8b5cf6" },
  { id: "4", name: "Entertainment", allocated: 0, spent: 0, color: "#f59e0b" },
]

export default function FinancialTracker() {
  const [totalBudget, setTotalBudget] = useState(0)
  const [currency, setCurrency] = useState("MYR")
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories)
  const [savedTrackers, setSavedTrackers] = useState<SavedTracker[]>([])
  const [showTotalBudgetDialog, setShowTotalBudgetDialog] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [newTotalBudget, setNewTotalBudget] = useState("")
  const [newCurrency, setNewCurrency] = useState(currency)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [allocatedAmount, setAllocatedAmount] = useState("")
  const [spentAmount, setSpentAmount] = useState("")
  const [trackerName, setTrackerName] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("financial-trackers")
    if (saved) {
      setSavedTrackers(JSON.parse(saved))
    }
  }, [])

  const formatCurrency = (amount: number) => {
    const currencyInfo = currencies.find((c) => c.code === currency)
    return `${currencyInfo?.symbol}${amount.toLocaleString()}`
  }

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0)
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0)
  const remainingBudget = totalBudget - totalSpent
  const activeCategories = categories.filter((cat) => cat.spent > 0).length
  const overBudgetCategories = categories.filter((cat) => cat.spent > cat.allocated).length

  const handleSetTotalBudget = () => {
    const amount = Number.parseFloat(newTotalBudget)
    if (amount > 0) {
      setTotalBudget(amount)
      setCurrency(newCurrency)
      setShowTotalBudgetDialog(false)
      setNewTotalBudget("")
      toast({
        title: "Budget Updated",
        description: `Total budget set to ${formatCurrency(amount)}`,
      })
    }
  }

  const handleSetCategoryAmount = () => {
    const allocated = Number.parseFloat(allocatedAmount)
    const spent = Number.parseFloat(spentAmount)

    if (allocated < 0 || spent < 0) {
      toast({
        title: "Invalid Amount",
        description: "Amounts cannot be negative",
        variant: "destructive",
      })
      return
    }

    if (spent > allocated) {
      toast({
        title: "Warning",
        description: "Spent amount exceeds allocated budget",
        variant: "destructive",
      })
    }

    if (selectedCategory === "new" && newCategoryName.trim()) {
      const newCategory: BudgetCategory = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        allocated: allocated || 0,
        spent: spent || 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      }
      setCategories([...categories, newCategory])
      toast({
        title: "Category Added",
        description: `${newCategoryName} has been added to your budget`,
      })
    } else if (selectedCategory && selectedCategory !== "new") {
      setCategories(
        categories.map((cat) =>
          cat.id === selectedCategory
            ? { ...cat, allocated: allocated || cat.allocated, spent: spent || cat.spent }
            : cat,
        ),
      )
      const categoryName = categories.find((cat) => cat.id === selectedCategory)?.name
      toast({
        title: "Category Updated",
        description: `${categoryName} has been updated`,
      })
    }

    setShowCategoryDialog(false)
    setSelectedCategory("")
    setNewCategoryName("")
    setAllocatedAmount("")
    setSpentAmount("")
  }

  const removeCategory = (categoryId: string) => {
    const categoryName = categories.find((cat) => cat.id === categoryId)?.name
    setCategories(categories.filter((cat) => cat.id !== categoryId))
    toast({
      title: "Category Removed",
      description: `${categoryName} has been removed from your budget`,
    })
  }

  const handleSaveTracker = () => {
    if (!trackerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your tracker",
        variant: "destructive",
      })
      return
    }

    const newTracker: SavedTracker = {
      id: Date.now().toString(),
      name: trackerName.trim(),
      date: new Date().toLocaleDateString("en-GB"),
      totalBudget,
      currency,
      categories: [...categories],
    }

    const updatedTrackers = [...savedTrackers, newTracker]
    setSavedTrackers(updatedTrackers)
    localStorage.setItem("financial-trackers", JSON.stringify(updatedTrackers))

    setShowSaveDialog(false)
    setTrackerName("")
    toast({
      title: "Tracker Saved",
      description: `${newTracker.name} has been saved successfully`,
    })
  }

  const loadTracker = (tracker: SavedTracker) => {
    setTotalBudget(tracker.totalBudget)
    setCurrency(tracker.currency)
    setCategories(tracker.categories)
    setShowHistoryDialog(false)
    toast({
      title: "Tracker Loaded",
      description: `${tracker.name} has been loaded`,
    })
  }

  const deleteTracker = (trackerId: string) => {
    const updatedTrackers = savedTrackers.filter((t) => t.id !== trackerId)
    setSavedTrackers(updatedTrackers)
    localStorage.setItem("financial-trackers", JSON.stringify(updatedTrackers))
    toast({
      title: "Tracker Deleted",
      description: "Tracker has been removed from history",
    })
  }

  const getStatusBadge = (category: BudgetCategory) => {
    if (category.spent === 0) {
      return <Badge variant="secondary">Not Started</Badge>
    } else if (category.spent > category.allocated) {
      return <Badge variant="destructive">Over Budget</Badge>
    } else if (category.spent === category.allocated) {
      return <Badge variant="outline">Fully Used</Badge>
    } else {
      return (
        <Badge variant="default" className="bg-green-500">
          Within Budget
        </Badge>
      )
    }
  }

  const chartColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"]

  const pieChartData = categories.map((category, index) => ({
    name: category.name,
    value: category.spent,
    fill: chartColors[index % chartColors.length],
  }))

  const barChartData = categories.map((category) => ({
    name: category.name,
    allocated: category.allocated,
    spent: category.spent,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-emerald-800">Financial Tracker</h1>
          <p className="text-black">Track your daily expenses and manage your budget effectively!</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Dialog open={showTotalBudgetDialog} onOpenChange={setShowTotalBudgetDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">Set Total Budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Total Budget</DialogTitle>
                <DialogDescription>
                  Current: {formatCurrency(totalBudget)} | Spent: {formatCurrency(totalSpent)} | Allocated:{" "}
                  {formatCurrency(totalAllocated)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={newCurrency} onValueChange={setNewCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="total-budget">Total Budget Amount</Label>
                  <Input
                    id="total-budget"
                    type="number"
                    placeholder="Enter total budget"
                    value={newTotalBudget}
                    onChange={(e) => setNewTotalBudget(e.target.value)}
                  />
                </div>
                <Button onClick={handleSetTotalBudget} className="w-full">
                  Update Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">Set Category Amount</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Category Amount</DialogTitle>
                <DialogDescription>Update budget allocation and spending for a category</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">Create New Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory === "new" && (
                  <div>
                    <Label htmlFor="new-category">New Category Name</Label>
                    <Input
                      id="new-category"
                      placeholder="Enter category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="allocated">Allocated Amount</Label>
                    <Input
                      id="allocated"
                      type="number"
                      placeholder="Budget allocation"
                      value={allocatedAmount}
                      onChange={(e) => setAllocatedAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="spent">Spent Amount</Label>
                    <Input
                      id="spent"
                      type="number"
                      placeholder="Amount spent"
                      value={spentAmount}
                      onChange={(e) => setSpentAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSetCategoryAmount} className="w-full">
                  Update Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Financial Record</DialogTitle>
                <DialogDescription>Save your current financial tracker state for future reference</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-2">Current Record Summary:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Total Budget: {formatCurrency(totalBudget)}</li>
                    <li>• Total Spent: {formatCurrency(totalSpent)}</li>
                    <li>• Total Remaining: {formatCurrency(remainingBudget)}</li>
                    <li>• Date: {new Date().toLocaleDateString("en-GB")}</li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="tracker-name">Record Name</Label>
                  <Input
                    id="tracker-name"
                    placeholder="e.g., January 2024, Weekly Budget, Monthly Expenses"
                    value={trackerName}
                    onChange={(e) => setTrackerName(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveTracker} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Record
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-900" />
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-start">
                <div className="text-2xl font-bold text-green-900">
                  {totalBudget === 0 ? "--" : formatCurrency(totalBudget)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-900" />
                Total Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold text-green-900 ${totalSpent > totalBudget ? "text-red-600" : ""}`}>
                {totalSpent === 0 ? "--" : formatCurrency(totalSpent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-900" />
                Total Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold text-green-900 ${remainingBudget < 0 ? "text-red-600" : "text-green-600"}`}
              >
                {totalBudget === 0 ? "--" : formatCurrency(remainingBudget)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Savings/Overspending Status */}
        <Card className={remainingBudget >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
          <CardContent className="pt-6">
            <div className="text-center">
              {remainingBudget >= 0 ? (
                <div>
                  <div className="text-2xl font-bold text-green-600">🎉 You save {formatCurrency(remainingBudget)}</div>
                  <p className="text-green-700 mt-1">Great job staying within budget!</p>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-red-600">😱 Oh No...</div>
                  <p className="text-red-700 mt-1">You're over budget by {formatCurrency(Math.abs(remainingBudget))}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>Track your spending across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={() => removeCategory(category.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium pr-8">{category.name}</CardTitle>
                    </div>
                    <div className="mt-2">{getStatusBadge(category)}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Allocated:</span>
                        <span className="font-medium">{formatCurrency(category.allocated)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Spent:</span>
                        <span className={`font-medium ${category.spent > category.allocated ? "text-red-600" : ""}`}>
                          {formatCurrency(category.spent)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Remaining:</span>
                        <span
                          className={`font-medium ${category.allocated - category.spent < 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatCurrency(category.allocated - category.spent)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((category.spent / category.allocated) * 100, 100)}
                        className={`h-2 ${category.spent > category.allocated ? "[&>div]:bg-red-500" : ""}`}
                      />
                      {category.spent > category.allocated && (
                        <p className="text-xs text-red-600 font-medium">Over Budget!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending Breakdown</CardTitle>
              <CardDescription>Distribution of expenses by category</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer
                config={{
                  spending: {
                    label: "Spending",
                  },
                }}
                className="h-[300px] w-full max-w-md mx-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget vs Spending</CardTitle>
              <CardDescription>Compare allocated budget with actual spending</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer
                config={{
                  allocated: {
                    label: "Budget",
                    color: "#10b981",
                  },
                  spent: {
                    label: "Spending",
                    color: "#ef4444",
                  },
                }}
                className="h-[300px] w-full max-w-2xl mx-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="allocated" fill="#10b981" name="Budget" />
                    <Bar dataKey="spent" fill="#ef4444" name="Spending" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary with financial condition assessment */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Summary</CardTitle>
              <CardDescription>Your financial tracker condition overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-blue-700">
                  <p>Current Status:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Total Budget: {formatCurrency(totalBudget)}</li>
                    <li>Total Spent: {formatCurrency(totalSpent)}</li>
                    <li>Total Remaining: {formatCurrency(remainingBudget)}</li>
                    <li>Date: {new Date().toLocaleDateString("en-GB")}</li>
                  </ul>
                </div>
                {/* Financial condition assessment */}
                <div
                  className={`p-3 rounded-lg text-center ${
                    remainingBudget >= totalBudget * 0.2
                      ? "bg-green-100 border border-green-300"
                      : remainingBudget >= 0
                        ? "bg-yellow-100 border border-yellow-300"
                        : "bg-red-100 border border-red-300"
                  }`}
                >
                  <div className="font-semibold">
                    {remainingBudget >= totalBudget * 0.2
                      ? "✅ Excellent Financial Health"
                      : remainingBudget >= 0
                        ? "⚠️ Moderate Financial Health"
                        : "❌ Poor Financial Health"}
                  </div>
                  <div className="text-xs mt-1">
                    {remainingBudget >= totalBudget * 0.2
                      ? "You're managing your budget very well!"
                      : remainingBudget >= 0
                        ? "Consider monitoring your spending more closely."
                        : "You need to review and adjust your spending immediately."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* History Records */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">History Records</CardTitle>
              <CardDescription>View and manage your saved trackers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-purple-700">
                  <p>Saved Trackers: {savedTrackers.length}</p>
                  {savedTrackers.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-medium">Recent:</p>
                      {savedTrackers
                        .slice(-3)
                        .reverse()
                        .map((tracker) => (
                          <div key={tracker.id} className="text-xs bg-white p-2 rounded border">
                            <div className="font-medium">{tracker.name}</div>
                            <div className="text-gray-600">
                              {tracker.date} • {currencies.find((c) => c.code === tracker.currency)?.symbol}
                              {tracker.totalBudget.toLocaleString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full bg-purple-100 hover:bg-purple-200 border-purple-300">
                      <History className="w-4 h-4 mr-2" />
                      View All History
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Saved Trackers</DialogTitle>
                      <DialogDescription>Load or delete your previously saved trackers</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {savedTrackers.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No saved trackers yet</p>
                      ) : (
                        savedTrackers.map((tracker) => (
                          <div key={tracker.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-semibold">{tracker.name}</h3>
                              <p className="text-sm text-gray-600">
                                {tracker.date} • {currencies.find((c) => c.code === tracker.currency)?.symbol}
                                {tracker.totalBudget.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">{tracker.categories.length} categories</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => loadTracker(tracker)}>
                                Load
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteTracker(tracker.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
