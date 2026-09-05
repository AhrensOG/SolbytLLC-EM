import { Skeleton } from "@/components/ui/Skeleton";

export default function TeamLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}