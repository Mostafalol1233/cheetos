import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Filter, Star, ShoppingCart, Check } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Game, Category } from "@shared/schema";

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addingItems, setAddingItems] = useState<string[]>([]);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(res => res.json()) as Promise<Category[]>
  });

  const { data: allGames = [], isLoading } = useQuery({
    queryKey: ["/api/games"],
    queryFn: () => fetch("/api/games").then(res => res.json()) as Promise<Game[]>
  });

  const handleAddToCart = (game: Game) => {
    setAddingItems(prev => [...prev, game.id]);
    addToCart({
      id: game.id,
      name: game.name,
      price: parseFloat(game.price.toString()),
      image: game.image
    });
    toast({
      title: "Success! ✅",
      description: `${game.name} added to cart`,
      duration: 2000,
    });
    setTimeout(() => {
      setAddingItems(prev => prev.filter(id => id !== game.id));
    }, 1000);
  };

  // Filter games based on search and category
  const filteredGames = allGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">All Games</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Browse our complete collection of games</p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredGames.length} games found
            </h2>
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const isAdding = addingItems.includes(game.id);
              return (
                <div key={game.id} className="relative group">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/30 bg-gradient-to-b from-gray-900 to-black p-4 h-80 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:border-cyan-400/60">
                    {/* Card glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-300 pointer-events-none"></div>
                    
                    {/* Game Image */}
                    <div className="relative rounded-lg overflow-hidden border border-cyan-400/20 bg-gray-800 flex-1 mb-3 flex items-center justify-center">
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                      {game.isPopular && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </div>
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="relative z-10">
                      <h3 className="font-bold text-white mb-1 text-lg line-clamp-1">{game.name}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-cyan-400 font-bold text-lg">{game.price} EGP</span>
                        <span className="text-xs text-cyan-300/70 bg-cyan-400/10 px-2 py-1 rounded">Stock: {game.stock}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="relative z-10 flex gap-2">
                      <Link href={`/game/${game.slug}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300"
                        >
                          View
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleAddToCart(game)}
                        disabled={isAdding}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold gap-1"
                      >
                        {isAdding ? (
                          <>
                            <Check className="w-4 h-4" />
                            Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Games Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}