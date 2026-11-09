import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns: number;
  height?: string;
}

export const TableSkeletonRow: React.FC<{ columns: number }> = ({ columns }) => (
  <TableRow>
    {Array.from({ length: columns }).map((_, index) => (
      <TableCell key={index}>
        <Skeleton className="h-4 w-full" />
      </TableCell>
    ))}
  </TableRow>
);

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5, 
  columns 
}) => (
  <>
    {Array.from({ length: rows }).map((_, index) => (
      <TableSkeletonRow key={index} columns={columns} />
    ))}
  </>
);

export default { TableSkeletonRow, TableSkeleton };