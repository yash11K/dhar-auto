import { Table, Card, Space, Select, DatePicker, Tag, Typography, Button, Collapse, Tooltip, Spin, Radio, Checkbox } from 'antd';
import { useState, useMemo } from 'react';
import { ReloadOutlined, SettingOutlined, InfoCircleOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import { motion } from 'framer-motion';
import { Box, Paper } from '@mui/material';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

function TabularView({ data, loading, pagination, onPageChange, temperatureStats }) {
  const [selectedZones, setSelectedZones] = useState(Array.from({ length: 14 }, (_, i) => i + 1));
  const [dateRange, setDateRange] = useState(() => {
    if (pagination.dateRange) {
      return [dayjs(pagination.dateRange[0]), dayjs(pagination.dateRange[1])];
    }
    return [dayjs().subtract(30, 'days'), dayjs()];
  });
  const [selectedStatistic, setSelectedStatistic] = useState('average');
  const [selectedZonesForStats, setSelectedZonesForStats] = useState([1]);
  const [calculatedStats, setCalculatedStats] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [showStatsCalculator, setShowStatsCalculator] = useState(false);

  const handleChange = (pagination) => {
    const newOffset = (pagination.current - 1) * pagination.pageSize;
    if (dateRange && dateRange.length === 2) {
      onPageChange(newOffset, pagination.pageSize, [
        dateRange[0].startOf('day').toISOString(),
        dateRange[1].endOf('day').toISOString()
      ]);
    }
  };

  const resetSort = () => {
    setSortedInfo({
      columnKey: 'datetime',
      order: 'ascend'
    });
  };

  const handleDateRangeChange = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      const defaultRange = [dayjs().subtract(30, 'days'), dayjs()];
      setDateRange(defaultRange);
      onPageChange(0, pagination.limit, [
        defaultRange[0].startOf('day').toISOString(),
        defaultRange[1].endOf('day').toISOString()
      ]);
      return;
    }
    
    const startDate = dayjs(dates[0]).startOf('day');
    const endDate = dayjs(dates[1]).endOf('day');
    
    if (!startDate.isValid() || !endDate.isValid()) {
      console.error('Invalid date range selected');
      return;
    }
    
    setDateRange([startDate, endDate]);
    onPageChange(0, pagination.limit, [
      startDate.toISOString(),
      endDate.toISOString()
    ]);
  };

  const resetSelections = () => {
    const defaultRange = [dayjs().subtract(30, 'days'), dayjs()];
    setSelectedZones(Array.from({ length: 14 }, (_, i) => i + 1));
    setDateRange(defaultRange);
    onPageChange(0, pagination.limit, [
      defaultRange[0].startOf('day').toISOString(),
      defaultRange[1].endOf('day').toISOString()
    ]);
  };

  const resetCalculations = () => {
    setSelectedStatistic('average');
    setCalculatedStats(null);
  };

  const handleSelectAllZones = (checked) => {
    setSelectedZones(checked ? Array.from({ length: 14 }, (_, i) => i + 1) : []);
  };

  const handleExportData = () => {
    if (!data || data.length === 0) return;

    // Prepare CSV headers
    const headers = ['Timestamp', ...selectedZones.map(zone => `Zone ${zone}`)];
    
    // Prepare CSV rows
    const csvRows = data.map(item => {
      const row = [dayjs(item.datetime).format('YYYY-MM-DD HH:mm:ss')];
      selectedZones.forEach(zone => {
        const temp = item[`T${zone}`];
        row.push(temp !== null && temp !== undefined ? temp.toFixed(2) : '');
      });
      return row;
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `temperature_data_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process data for display
  const tableData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.log('Data is not available yet:', data);
      return [];
    }
    return data.map(item => ({
      ...item,
      key: item.id || Math.random(),
    }));
  }, [data]);

  const renderTemperature = (value) => {
    if (value === null || value === undefined) return '-';
    const temp = Number(value.toFixed(2));
    const { min, max, avg } = temperatureStats || {};
    
    let color = 'processing';  // Normal range
    if (min && temp <= min) color = 'success';  // Low range
    else if (max && temp >= max) color = 'error';  // High range
    
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Tag color={color}>{temp}°C</Tag>
      </motion.div>
    );
  };

  // Calculate custom statistics
  const calculateStatistics = () => {
    if (!data || data.length === 0 || !selectedZones.length) return null;

    const stats = {};
    selectedZones.forEach(zone => {
      const values = data
        .map(item => item[`T${zone}`])
        .filter(val => val !== null && val !== undefined);

      if (values.length === 0) return;

      switch (selectedStatistic) {
        case 'average':
          stats[`Zone ${zone}`] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'median': {
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          stats[`Zone ${zone}`] = sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
          break;
        }
        case 'mode': {
          const freq = {};
          values.forEach(val => freq[val] = (freq[val] || 0) + 1);
          const maxFreq = Math.max(...Object.values(freq));
          stats[`Zone ${zone}`] = Number(Object.keys(freq).find(key => freq[key] === maxFreq));
          break;
        }
        case 'range':
          stats[`Zone ${zone}`] = {
            min: Math.min(...values),
            max: Math.max(...values)
          };
          break;
        case 'variance': {
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          stats[`Zone ${zone}`] = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
          break;
        }
      }
    });

    setCalculatedStats(stats);
  };

  // Base columns without temperature zones
  const baseColumns = [
    {
      title: 'Time Stamp',
      dataIndex: 'datetime',
      key: 'datetime',
      render: (text) => (
        <Text strong>
          {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      ),
      width: 180,
      fixed: 'left',
    },
  ];

  // Temperature zone columns based on selection
  const temperatureColumns = selectedZones.map(zoneNum => ({
    title: (
      <Space>
        Zone {zoneNum}
        <Tooltip title="Temperature reading from sensor">
          <InfoCircleOutlined style={{ fontSize: '12px' }} />
        </Tooltip>
      </Space>
    ),
    dataIndex: `T${zoneNum}`,
    key: `T${zoneNum}`,
    render: renderTemperature,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        title={
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-between items-center"
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              Temperature Data Table
            </Typography.Title>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportData}
              disabled={!data || data.length === 0}
            >
              Export Data
            </Button>
          </motion.div>
        }
        className="shadow-lg rounded-lg"
        bordered={false}
      >
        <Collapse 
          ghost
          expandIconPosition="end"
          className="mb-6 bg-gray-50 rounded-lg border border-gray-200"
        >
          <Panel 
            header={
              <Space>
                <SettingOutlined />
                <Text strong>Display & Analysis Options</Text>
              </Space>
            }
            key="1"
            className="p-4"
          >
            <div className="bg-white p-6 rounded-lg border border-gray-100">
              <Space direction="vertical" className="w-full" size="middle">
                {/* Date Range Selection */}
                <div>
                  <Text strong>Date Range:</Text>
                  <div className="mt-2 flex gap-4 items-center">
                    <RangePicker
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      className="w-96"
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
                  <div className="flex justify-between items-center mb-2">
                    <Text strong>Temperature Zones:</Text>
                    <Checkbox
                      checked={selectedZones.length === 14}
                      indeterminate={selectedZones.length > 0 && selectedZones.length < 14}
                      onChange={(e) => handleSelectAllZones(e.target.checked)}
                    >
                      Select All Zones
                    </Checkbox>
                  </div>
                  <Select
                    mode="multiple"
                    className="w-full"
                    placeholder="Select zones to display"
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

                {/* Statistics Calculator */}
                <div>
                  <Text strong>Statistics Analysis:</Text>
                  <div className="mt-2 flex gap-4 items-center">
                    <Select
                      style={{ width: 200 }}
                      value={selectedStatistic}
                      onChange={setSelectedStatistic}
                    >
                      <Option value="average">Average Temperature</Option>
                      <Option value="median">Median Temperature</Option>
                      <Option value="mode">Mode Temperature</Option>
                      <Option value="range">Temperature Range</Option>
                      <Option value="variance">Temperature Variance</Option>
                    </Select>
                    <Button 
                      type="primary" 
                      onClick={calculateStatistics}
                      disabled={selectedZones.length === 0}
                    >
                      Calculate
                    </Button>
                  </div>
                  
                  {calculatedStats && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <Space wrap>
                        {Object.entries(calculatedStats).map(([zone, value]) => (
                          <Tag key={zone} color="blue">
                            {zone}: {
                              typeof value === 'object' 
                                ? `Min: ${value.min.toFixed(2)}°C, Max: ${value.max.toFixed(2)}°C`
                                : `${value.toFixed(2)}${selectedStatistic === 'variance' ? '' : '°C'}`
                            }
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </div>

                {/* Reset Controls */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Space>
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={resetSelections}
                      size="small"
                    >
                      Reset Selections
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={resetCalculations}
                      size="small"
                      disabled={!calculatedStats}
                    >
                      Reset Calculations
                    </Button>
                  </Space>
                  <Space>
                    <Text strong>Sort Order:</Text>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={resetSort}
                      size="small"
                    >
                      Reset Sort
                    </Button>
                  </Space>
                </div>
              </Space>
            </div>
          </Panel>
        </Collapse>

        {/* Temperature Stats */}
        {temperatureStats && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Text strong>Overall Statistics:</Text>
            <Space wrap>
              <Tag color="success">Min: {temperatureStats.min?.toFixed(2)}°C</Tag>
              <Tag color="processing">Avg: {temperatureStats.avg?.toFixed(2)}°C</Tag>
              <Tag color="error">Max: {temperatureStats.max?.toFixed(2)}°C</Tag>
            </Space>
          </Box>
        )}

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center">
              <Spin size="large" />
            </div>
          )}
          <Table
            columns={[...baseColumns, ...temperatureColumns]}
            dataSource={tableData}
            onChange={handleChange}
            scroll={{ x: 'max-content' }}
            size="small"
            pagination={{
              total: pagination.total,
              pageSize: pagination.limit,
              current: Math.floor(pagination.offset / pagination.limit) + 1,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} records`,
              pageSizeOptions: ['10', '50', '100', '1000'],
            }}
            className="shadow-sm"
          />
        </div>
      </Card>
    </motion.div>
  );
}

export default TabularView;