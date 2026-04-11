import { dashboardRepository } from '../repositories/dashboard.repository';
import { AuthenticatedUser } from '../types/auth';

export const dashboardService = {
  async getStats() {
    return dashboardRepository.getStats();
  },

  async getEmployeeStats(authUser: AuthenticatedUser) {
    return dashboardRepository.getEmployeeStats(authUser.id);
  },
};
