import React, { useState, useEffect } from 'react';
import { Card, Space, Select, DatePicker, Button, Typography, message, Radio, Tooltip, Input } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FolderOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

function ExportPage({ temperatureStats, dateRange: propDateRange, onDateRangeChange }) {
  const [selectedZones, setSelectedZones] = useState([1, 2, 3, 4]);
  const [localDateRange, setLocalDateRange] = useState(propDateRange || [dayjs().subtract(30, 'days'), dayjs()]);
  const [exportType, setExportType] = useState('excel');
  const [loading, setLoading] = useState(false);
  const [exportDirectory, setExportDirectory] = useState('');

  // Update local dateRange when prop changes
  useEffect(() => {
    if (propDateRange) {
      setLocalDateRange(propDateRange);
    }
  }, [propDateRange]);

  const handleDateRangeChange = (newRange) => {
    setLocalDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange);
    }
  };

  const handleExport = async () => {
    if (!localDateRange || !selectedZones.length) {
      message.error('Please select date range and zones');
      return;
    }

    if (!exportDirectory.trim()) {
      message.error('Please specify an export directory');
      return;
    }

    setLoading(true);
    try {
      const startDate = localDateRange[0].startOf('day');
      const endDate = localDateRange[1].endOf('day');
      
      const response = await fetch('/api/temperature-data/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          zones: selectedZones,
          format: exportType,
          exportDirectory: exportDirectory.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }

      const result = await response.json();
      
      if (result.success) {
        message.success(`${exportType.toUpperCase()} file exported successfully to ${result.filePath}`);
      } else {
        throw new Error(result.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error(error.message || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg rounded-lg">
      <Title level={4}>Export Temperature Data</Title>
      
      <Space direction="vertical" size="large" className="w-full">
        {/* Date Range Selection */}
        <div>
          <Text strong>Select Date Range:</Text>
          <div className="mt-2">
            <RangePicker
              value={localDateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              ranges={{
                'Last 7 Days': [dayjs().subtract(6, 'days'), dayjs()],
                'Last 14 Days': [dayjs().subtract(13, 'days'), dayjs()],
                'Last 30 Days': [dayjs().subtract(29, 'days'), dayjs()],
                'Last 90 Days': [dayjs().subtract(89, 'days'), dayjs()],
              }}
            />
          </div>
        </div>

        {/* Zone Selection */}
        <div>
          <Text strong>Select Zones:</Text>
          <div className="mt-2">
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Select zones to export"
              value={selectedZones}
              onChange={setSelectedZones}
              maxTagCount="responsive"
            >
              {Array.from({ length: 14 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>
                  Zone {i + 1}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {/* Export Directory Selection */}
        <div>
          <Text strong>Export Directory:</Text>
          <div className="mt-2">
            <Input
              placeholder="Enter export directory path"
              value={exportDirectory}
              onChange={(e) => setExportDirectory(e.target.value)}
              prefix={<FolderOutlined />}
              allowClear
            />
            <Text type="secondary" className="mt-1 block">
              Example: /Users/username/Documents/exports
            </Text>
          </div>
        </div>

        {/* Export Type Selection */}
        <div>
          <Text strong>Export Format:</Text>
          <div className="mt-2">
            <Radio.Group value={exportType} onChange={e => setExportType(e.target.value)}>
              <Radio.Button value="excel">
                <Tooltip title="Export as Excel spreadsheet">
                  <Space>
                    <FileExcelOutlined />
                    Excel
                  </Space>
                </Tooltip>
              </Radio.Button>
              <Radio.Button value="pdf">
                <Tooltip title="Generate detailed PDF report with graphs">
                  <Space>
                    <FilePdfOutlined />
                    PDF Report
                  </Space>
                </Tooltip>
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {/* Export Button */}
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={loading}
          size="large"
        >
          {loading ? 'Exporting...' : `Export as ${exportType.toUpperCase()}`}
        </Button>
      </Space>
    </Card>
  );
}

export default ExportPage; 