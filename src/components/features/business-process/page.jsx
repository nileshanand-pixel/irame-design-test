import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names
import capitalize from 'lodash.capitalize';

const BusinessProcessPage = () => {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate

    // Mock data generator in the new format
    const generateMockProcesses = (pageNum) => {
        return Array.from({ length: 12 }, (_, i) => ({
            external_id: `mock-id-${pageNum * 4 + i}`, // Unique ID for each process
            name: [
                'Procure to Pay (P2P)',
                'Order to Cash (O2C)',
                'Record to Report (R2R)',
                'Hire to Retire (H2R)',
            ][i % 4], // Cycle through these names
            description: [
                'End-to-end procurement and payment process.',
                'End-to-end order management and cash collection.',
                'End-to-end financial reporting and compliance.',
                'End-to-end employee lifecycle management.',
            ][i % 4], // Cycle through these descriptions
            tags: [
                ['p2p', 'procurement', 'finance'],
                ['o2c', 'sales', 'finance'],
                ['r2r', 'finance', 'compliance'],
                ['h2r', 'hr', 'employee'],
            ][i % 4], // Cycle through these tags
        }));
    };

    // Infinite scroll handler
    const handleScroll = (e) => {
        const bottom =
            Math.abs(
                e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight,
            ) < 1;

        if (bottom && !loading) {
            setLoading(true);
            setPage((prev) => prev + 1);
        }
    };

    // Load more data
    useEffect(() => {
        const newProcesses = generateMockProcesses(page);
        setProcesses((prev) => [...prev, ...newProcesses]);
        setLoading(false);
    }, [page]);

    // Filter processes based on search text
    const filteredProcesses = useMemo(() => {
        if (!search) return processes;

        return processes.filter((process) => {
            const nameMatch = process?.name?.toLowerCase().startsWith(search.toLowerCase());
            const tagsMatch = process?.tags?.some(tag => tag.toLowerCase().startsWith(search.toLowerCase()));
            return nameMatch || tagsMatch;
        });
    }, [processes, search]);

    // Handle card click
    const handleCardClick = (externalId) => {
        navigate(`/app/business-process/${externalId}`); // Navigate to the new route
    };

    return (
        <div className="h-full w-full">
            {/* Page header */}
            <div className="max-w-full mb-6">
                <h1 className="text-2xl font-semibold text-primary80">
                    Business Process
                </h1>
                <p className="text-primary40">
                    Manage, view and edit your workflows
                </p>
            </div>

            {/* Main container with rounded corners */}
            <div className="max-w-full border-2 mb-2 border-primary8 bg-misc-offWhite shadow-1xl bg-white rounded-3xl">
                {/* Search and Create button container */}
                <div className="p-4 mt-2">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex items-center bg-white border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300 w-[300px]">
                            <i className="bi-search text-primary40 me-2"></i>
                            <Input
                                placeholder="Search"
                                className={cn(
                                    'border-none rounded-sm px-0 text-primary40 font-medium bg-white',
                                )}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
                            onClick={() => alert('implement create new process')}
                        >
                            Create New Process
                        </Button>
                    </div>
                </div>

                {/* Scrollable cards container with its own rounded corners */}
                <div
                    className="px-4 py-2 mb-4 overflow-y-auto max-h-[calc(100vh-270px)]"
                    onScroll={handleScroll}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProcesses.map((process) => (
                            <Card
                                key={process.external_id}
                                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" // Add cursor-pointer here
                                onClick={() => handleCardClick(process.external_id)} // Add onClick handler
                            >
                                <CardHeader>
                                    <div className="flex text-primary100 gap-2">
                                        <span className="material-symbols-outlined w-fit rounded-lg p-2 border border-primary10">
                                            family_history
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-primary100">
                                    <CardTitle className="text-lg font-semibold">
                                        {process.name}
                                    </CardTitle>
                                    <p className="text-primary80 mb-4">
                                        {process.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {process?.tags?.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="px-2 py-1 bg-primary4 border-none">
                                                {capitalize(tag)}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {loading && (
                        <div className="text-center py-4">
                            Loading more processes...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessProcessPage;