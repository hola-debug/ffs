import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ffs_module_order';

export interface ModuleOrderItem {
  id: string;
  position: number;
}

export function useModuleOrder(moduleIds: string[]) {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  // Load saved order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    if (savedOrder) {
      try {
        const parsed: string[] = JSON.parse(savedOrder);
        // Validate that saved IDs match current modules
        const validIds = parsed.filter(id => moduleIds.includes(id));
        // Add any new modules that weren't in saved order
        const newIds = moduleIds.filter(id => !validIds.includes(id));
        setOrderedIds([...validIds, ...newIds]);
      } catch (error) {
        console.error('Error parsing saved module order:', error);
        setOrderedIds(moduleIds);
      }
    } else {
      setOrderedIds(moduleIds);
    }
  }, [moduleIds.join(',')]);

  // Save order to localStorage
  const saveOrder = useCallback((newOrder: string[]) => {
    setOrderedIds(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  }, []);

  // Handle reorder when drag ends
  const handleReorder = useCallback((activeId: string, overId: string) => {
    setOrderedIds((current) => {
      const oldIndex = current.indexOf(activeId);
      const newIndex = current.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return current;

      const newOrder = [...current];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, activeId);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));

      return newOrder;
    });
  }, []);

  return {
    orderedIds,
    handleReorder,
    saveOrder,
  };
}
