import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityTrailSkeleton() {
    return (
        <>
            <Skeleton className="w-[150px] h-[25px] mb-6" />
            <div className="flex flex-col gap-4">
                {
                    Array.from({ length: 3 }, (_, i) => (
                        <Skeleton className="w-[250px] h-[20px]" />
                    ))
                }
            </div>
        </>
    )
}