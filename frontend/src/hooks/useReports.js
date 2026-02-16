import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import reportService from '../services/reportService';

const useReports = () => {
  const { loading, error, executeApiCall } = useApi();
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateDailySummary = useCallback(async (startDate, endDate = null) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getDailySummary(startDate, endDate),
        'Daily summary report generated successfully',
        'Failed to generate daily summary'
      );
      setReportData(data);
      return data;
    } catch (err) {
      console.error('Error generating daily summary:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateFarmerSummary = useCallback(async (farmerId, startDate, endDate) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getFarmerSummary(farmerId, startDate, endDate),
        'Farmer summary report generated successfully',
        'Failed to generate farmer summary'
      );
      setReportData(data);
      return data;
    } catch (err) {
      console.error('Error generating farmer summary:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateMarketAnalytics = useCallback(async (startDate, endDate) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getMarketAnalytics(startDate, endDate),
        'Market analytics report generated successfully',
        'Failed to generate market analytics'
      );
      setReportData(data);
      return data;
    } catch (err) {
      console.error('Error generating market analytics:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateSettlementReport = useCallback(async (startDate, endDate) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getSettlementReport(startDate, endDate),
        'Settlement report generated successfully',
        'Failed to generate settlement report'
      );
      setReportData(data);
      return data;
    } catch (err) {
      console.error('Error generating settlement report:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [executeApiCall]);

  const generateCashAdvanceReport = useCallback(async (startDate, endDate) => {
    try {
      setLoadingReports(true);
      const data = await executeApiCall(
        () => reportService.getCashAdvanceReport(startDate, endDate),
        'Cash advance report generated successfully',
        'Failed to generate cash advance report'
      );
      setReportData(data);
      return data;
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
export { useReports };
