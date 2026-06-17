import { create } from 'zustand';
import { teamsApi } from '../api';
import { TeamContribution, ContributionPeriod, CheckIn } from '../../shared/types';

interface TeamState {
  contributions: TeamContribution[];
  memberCheckIns: CheckIn[];
  contributionsLoading: boolean;
  checkInsLoading: boolean;
  selectedMemberId: number | null;
  showCheckInModal: boolean;
  fetchContributions: (teamId: number, period: ContributionPeriod) => Promise<void>;
  fetchMemberCheckIns: (teamId: number, userId: number) => Promise<void>;
  setSelectedMemberId: (id: number | null) => void;
  setShowCheckInModal: (show: boolean) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  contributions: [],
  memberCheckIns: [],
  contributionsLoading: false,
  checkInsLoading: false,
  selectedMemberId: null,
  showCheckInModal: false,

  fetchContributions: async (teamId: number, period: ContributionPeriod) => {
    set({ contributionsLoading: true });
    try {
      const data = await teamsApi.getContributions(teamId, period);
      set({ contributions: data, contributionsLoading: false });
    } catch (error) {
      set({ contributionsLoading: false });
      console.error('Fetch contributions failed:', error);
    }
  },

  fetchMemberCheckIns: async (teamId: number, userId: number) => {
    set({ checkInsLoading: true });
    try {
      const data = await teamsApi.getMemberCheckIns(teamId, userId);
      set({ memberCheckIns: data, checkInsLoading: false, selectedMemberId: userId, showCheckInModal: true });
    } catch (error) {
      set({ checkInsLoading: false });
      console.error('Fetch member check-ins failed:', error);
    }
  },

  setSelectedMemberId: (id: number | null) => {
    set({ selectedMemberId: id });
  },

  setShowCheckInModal: (show: boolean) => {
    set({ showCheckInModal: show });
  },
}));
