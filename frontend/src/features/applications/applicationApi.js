import api from '@/shared/api/axios';

export const applicationApi = {
  /**
   * Apply to a job with a resume file
   * @param {string} jobId 
   * @param {File} resumeFile 
   */
  applyToJob: async (jobId, resumeFile) => {
    const formData = new FormData();
    formData.append('resume', resumeFile);

    const { data } = await api.post(`/applications/${jobId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.application;
  },

  /**
   * Get current candidate's applications
   */
  getMyApplications: async () => {
    const { data } = await api.get('/applications/my');
    return data.data.applications;
  },

  /**
   * Get all applications for a specific job (HR only)
   */
  getJobApplications: async (jobId) => {
    const { data } = await api.get(`/applications/job/${jobId}`);
    return data.data.applications;
  }
};
