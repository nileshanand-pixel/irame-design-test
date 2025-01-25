import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function DataSourceSelector({ open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDataSourceId, setSelectedDataSourceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mockData, setMockData] = useState([]);

  // Simulated API call
  useEffect(() => {
    const fetchData = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data - replace with actual API call
      setMockData([
        { id: '1', name: 'Q1 sales data' },
        { id: '2', name: 'Q2 marketing data' },
        { id: '3', name: '2023 customer analytics' },
      ]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const filteredData = mockData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg">
        <DialogHeader className="border-b pb-4">
          <h2 className="text-lg font-semibold">Choose Data Source</h2>
          <p className="text-sm text-muted-foreground">
            You can always change it later from the data source page
          </p>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6">
          <Input 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Data List Area */}
        <div className="px-6 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            // Loading Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : filteredData.length === 0 ? (
            // No results state
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No such data source found
            </div>
          ) : (
            // Data source list
            filteredData.map((item) => (
              <label 
                key={item.id}
                className="flex items-center gap-4 p-3 rounded-md hover:bg-accent cursor-pointer"
              >
                <input
                  type="radio"
                  name="data-source"
                  className="h-4 w-4 text-primary border-gray-300"
                  checked={selectedDataSourceId === item.id}
                  onChange={() => setSelectedDataSourceId(item.id)}
                />
                <span className="material-symbols-outlined text-gray-500">
                  database
                </span>
                <span className="text-sm">{item.name}</span>
              </label>
            ))
          )}
        </div>

        {/* Upload Data Source (Placeholder) */}
        <div className="px-6 text-center text-sm text-primary cursor-not-allowed">
          Upload Data Source
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 px-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            disabled={!selectedDataSourceId}
            onClick={() => {
              // Handle continue action here
              console.log('Selected ID:', selectedDataSourceId);
              onOpenChange(false);
            }}
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}