import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import reportService from '../services/reportService';

const useReports = () => {
  const { loading, error, executeApiCall } = useApi();
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateDailySummary = useCallback(async (date) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getDailySummary(date),
        'Daily summary report generated successfully',
        'Failed to generate daily summary'
      );
      setReportData(data);
    } catch (err) {
      console.error('Error generating daily summary:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateFarmerSummary = useCallback(async (filters = {}) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getFarmerSummary(filters),
        'Farmer summary report generated successfully',
        'Failed to generate farmer summary'
      );
      setReportData(data);
    } catch (err) {
      console.error('Error generating farmer summary:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateMarketAnalytics = useCallback(async (dateRange) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getMarketAnalytics(dateRange),
        'Market analytics report generated successfully',
        'Failed to generate market analytics'
      );
      setReportData(data);
    } catch (err) {
      console.error('Error generating market analytics:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateSettlementReport = useCallback(async (filters = {}) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getSettlementReport(filters),
        'Settlement report generated successfully',
        'Failed to generate settlement report'
      );
      setReportData(data);
    } catch (err) {
      console.error('Error generating settlement report:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateCashAdvanceReport = useCallback(async (filters = {}) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getCashAdvanceReport(filters),
        'Cash advance report generated successfully',
        'Failed to generate cash advance report'
      );
      setReportData(data);
    } catch (err) {
      console.error('Error generating cash advance report:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const exportReport = useCallback(async (reportType, data, format = 'csv') => {
    try {
      await executeApiCall(
        () => reportService.export(reportType, data, format),
        'Report exported successfully',
        'Failed to export report'
      );
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  }, [executeApiCall]);

  return {
    loading: loadingReports,
    error,
    reportData,
    generateDailySummary,
    generateFarmerSummary,
    generateMarketAnalytics,
    generateSettlementReport,
    generateCashAdvanceReport,
    exportReport
  };
};

export default useReports;
