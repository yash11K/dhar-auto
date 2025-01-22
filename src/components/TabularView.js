import { Table, Card, Space, Select, DatePicker, InputNumber, Tag, Typography, Button, Collapse, Tooltip } from 'antd';
import { useState, useMemo } from 'react';
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

function TabularView({ data, loading, pagination, onPageChange, temperatureStats }) {
  const [selectedZones, setSelectedZones] = useState([1, 2, 3, 4]);
  const [sortedInfo, setSortedInfo] = useState({
    columnKey: 'date',
    order: 'ascend'
  });
  const [dateRange, setDateRange] = useState(null);

  const handleChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter);
    onPageChange(pagination.current, pagination.pageSize);
  };

  const resetSort = () => {
    setSortedInfo({
      columnKey: 'date',
      order: 'ascend'
    });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    if (dates) {
      onPageChange(1, pagination.pageSize, dates.map(date => date.format('YYYY-MM-DD')));
    } else {
      onPageChange(1, pagination.pageSize);
    }
  };

  // Process data for display
  const tableData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.log('Data is not available yet:', data);
      return [];
    }
    return data.map(item => {
      if (!item) return null;
      return {
        ...item,
        key: item.id || Math.random(), // Fallback for missing id
        formattedDate: item.date ? dayjs(item.date).format('DD/MM/YYYY') : '-',
        formattedTime: item.time || '-'
      };
    }).filter(Boolean); // Remove any null items
  }, [data]);

  console.log('Table data sample:', tableData[0]); // Debug log

  const renderTemperature = (value) => {
    if (value === null || value === undefined) return '-';
    const temp = Number(value.toFixed(2));
    const { q1, q3 } = temperatureStats || {};
    
    let color = 'blue';  // Normal range
    if (q1 && temp <= q1) color = 'green';  // Low range
    else if (q3 && temp >= q3) color = 'red';  // High range
    
    return <Tag color={color}>{temp}</Tag>;
  };

  // Base columns without temperature zones
  const baseColumns = [
    {
      title: 'Date',
      dataIndex: 'formattedDate',
      key: 'date',
      sorter: true,
      defaultSortOrder: 'ascend',
      render: (text) => (
        <Text strong>
          {text}
        </Text>
      ),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => {
              handleDateRangeChange(dates);
              setSelectedKeys(dates ? [dates] : []);
            }}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small">Filter</Button>
            <Button onClick={() => {
              clearFilters();
              handleDateRangeChange(null);
            }} size="small">Reset</Button>
          </Space>
        </div>
      ),
      width: 150,
    },
    {
      title: 'Time',
      dataIndex: 'formattedTime',
      key: 'time',
      sorter: true,
      defaultSortOrder: 'ascend',
      render: (text) => (
        <Text style={{ fontFamily: 'monospace' }}>
          {text}
        </Text>
      ),
      width: 100,
    },
  ];

  // Temperature zone columns based on selection
  const temperatureColumns = selectedZones.map(zoneNum => ({
    title: `Zone ${zoneNum}`,
    dataIndex: `T${zoneNum}`,
    key: `T${zoneNum}`,
    sorter: true,
    render: renderTemperature,
    filters: temperatureStats ? [
      { text: 'Low', value: 'low' },
      { text: 'Normal', value: 'normal' },
      { text: 'High', value: 'high' }
    ] : [],
    onFilter: (value, record) => {
      const temp = record[`T${zoneNum}`];
      if (!temp || !temperatureStats) return false;
      
      switch(value) {
        case 'low':
          return temp <= temperatureStats.q1;
        case 'normal':
          return temp > temperatureStats.q1 && temp < temperatureStats.q3;
        case 'high':
          return temp >= temperatureStats.q3;
        default:
          return false;
      }
    },
    width: 100,
  }));

  // Additional columns after temperature zones
  const additionalColumns = [
    {
      title: 'Events',
      dataIndex: 'events',
      key: 'events',
      sorter: true,
      filters: [
        { text: 'No Events', value: 0 },
        { text: 'Has Events', value: 1 },
      ],
      onFilter: (value, record) => value === 0 ? record.events === 0 : record.events > 0,
      render: (value) => value || '-',
    },
    {
      title: 'Blower Run Time',
      dataIndex: 'blowerRunTime',
      key: 'blowerRunTime',
      sorter: true,
      render: (value) => value ? `${value} min` : '-',
    },
    {
      title: 'Push Time (Norm)',
      dataIndex: 'pushTimeNormalizing',
      key: 'pushTimeNormalizing',
      sorter: true,
      render: (value) => value ? `${value} min` : '-',
    },
    {
      title: 'Preheat Time (Norm)',
      dataIndex: 'preheatingTimeNormalizing',
      key: 'preheatingTimeNormalizing',
      sorter: true,
      render: (value) => value ? `${value} min` : '-',
    },
    {
      title: 'Socking Time (Norm)',
      dataIndex: 'sockingTimeNormalizing',
      key: 'sockingTimeNormalizing',
      sorter: true,
      render: (value) => value ? `${value} min` : '-',
    },
  ];

  // Combine all columns
  const columns = [...baseColumns, ...temperatureColumns, ...additionalColumns];

  return (
    <Card 
      title="Temperature Data Table"
      style={{ border: 'none' }}
    >
      <Collapse 
        ghost
        expandIconPosition="end"
        style={{ 
          marginBottom: 16,
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: '8px'
        }}
      >
        <Panel 
          header={
            <Space>
              <SettingOutlined />
              <Text strong>Display Options</Text>
            </Space>
          }
          key="1"
          style={{ padding: '12px' }}
        >
          <div style={{ 
            background: '#fff',
            padding: '16px',
            borderRadius: '6px',
            border: '1px solid #f0f0f0'
          }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* Zone Selection */}
              <div>
                <Text strong>Temperature Zones:</Text>
                <Select
                  mode="multiple"
                  style={{ width: '100%', marginTop: 8 }}
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

              {/* Sort Controls */}
              <div>
                <Space align="center">
                  <Text strong>Sort Order:</Text>
                  <Tooltip title="Reset to default sort (Date → Time)">
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={resetSort}
                      size="small"
                    >
                      Reset Sort
                    </Button>
                  </Tooltip>
                </Space>
              </div>

              {/* Temperature Range Info */}
              {temperatureStats && (
                <div>
                  <Text strong>Temperature Ranges:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      <Tag color="green">Low: ≤{temperatureStats.q1.toFixed(2)}</Tag>
                      <Tag color="blue">Normal: {temperatureStats.q1.toFixed(2)}-{temperatureStats.q3.toFixed(2)}</Tag>
                      <Tag color="red">High: ≥{temperatureStats.q3.toFixed(2)}</Tag>
                    </Space>
                  </div>
                </div>
              )}
            </Space>
          </div>
        </Panel>
      </Collapse>

      <Table
        columns={columns}
        dataSource={tableData}
        loading={loading}
        onChange={handleChange}
        scroll={{ x: 'max-content' }}
        size="small"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} items`,
          pageSizeOptions: ['10', '50', '100', '500'],
        }}
      />
    </Card>
  );
}

export default TabularView; 