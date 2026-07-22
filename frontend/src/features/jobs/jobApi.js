import api from '@/shared/api/axios';

export const jobApi = {
  getJobs: async (params = {}) => {
    const { data } = await api.get('/jobs', { params });
    return data.data; // { jobs, total, page, limit }
  },

  getJobById: async (id) => {
    const { data } = await api.get(`/jobs/${id}`);
    return data.data.job;
  },

  createJob: async (jobData) => {
    const { data } = await api.post('/jobs', jobData);
    return data.data.job;
  },

  updateJob: async (id, jobData) => {
    const { data } = await api.patch(`/jobs/${id}`, jobData);
    return data.data.job;
  },

  updateJobStatus: async (id, status) => {
    const { data } = await api.patch(`/jobs/${id}/status`, { status });
    return data.data.job;
  },
};
