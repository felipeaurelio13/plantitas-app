import { create } from 'zustand';
import { produce } from 'immer';
import { generateInsights } from '../services/insightService';
import { Plant, type Insight } from '../schemas';

interface InsightState {
  insights: Record<string, Insight[]>;
  isLoading: Record<string, boolean>;
  error: Record<string, string | null>;
}

interface InsightActions {
  fetchInsights: (plant: Plant) => Promise<void>;
  clearInsights: (plantId: string) => void;
}

type InsightStore = InsightState & InsightActions;

export const useInsightStore = create<InsightStore>((set) => ({
  insights: {},
  isLoading: {},
  error: {},

  fetchInsights: async (plant) => {
    set(produce((state: InsightState) => {
      state.isLoading[plant.id] = true;
      state.error[plant.id] = null;
    }));

    try {
      const newInsights = await generateInsights(plant);
      set(produce((state: InsightState) => {
        state.insights[plant.id] = newInsights;
        state.isLoading[plant.id] = false;
      }));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to fetch insights';
      set(produce((state: InsightState) => {
        state.error[plant.id] = error;
        state.isLoading[plant.id] = false;
      }));
    }
  },

  clearInsights: (plantId) => {
    set(produce((state: InsightState) => {
      delete state.insights[plantId];
      delete state.isLoading[plantId];
      delete state.error[plantId];
    }));
  },
})); 