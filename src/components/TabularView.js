import { Table, Card, Space, Select, DatePicker, InputNumber, Tag, Typography, Button } from 'antd';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';

const { Option } = Select;
const { Text } = Typography;

function TabularView({ data, loading }) {
  const [selectedZones, setSelectedZones] = useState([1, 2, 3, 4]);

  const handleChange = (pagination, filters, sorter) => {
    // Table change handler - can be used for additional functionality
    console.log('Table params:', { pagination, filters, sorter });
  };

  // Calculate temperature thresholds based on data statistics
  const temperatureStats = useMemo(() => {
    const allTemps = [];
    for (let i = 1; i <= 14; i++) {
      const zoneTemps = data
        .map(row => row[`T${i}`])
        .filter(temp => temp != null && !isNaN(temp));
      allTemps.push(...zoneTemps);
    }

    // Sort temperatures for percentile calculations
    allTemps.sort((a, b) => a - b);
    
    const getPercentile = (arr, percentile) => {
      const index = Math.ceil(arr.length * percentile) - 1;
      return arr[index];
    };

    return {
      min: Math.min(...allTemps),
      max: Math.max(...allTemps),
      q1: getPercentile(allTemps, 0.25),
      q3: getPercentile(allTemps, 0.75),
      median: getPercentile(allTemps, 0.5)
    };
  }, [data]);

  const getTemperatureFilters = () => {
    const { min, max, q1, q3 } = temperatureStats;
    return [
      { text: 'Low', value: [min, q1] },
      { text: 'Normal', value: [q1, q3] },
      { text: 'High', value: [q3, max] }
    ];
  };

  const renderTemperature = (value) => {
    if (value === null || value === undefined) return '-';
    const temp = Number(value.toFixed(2));
    const { q1, q3 } = temperatureStats;
    
    let color = 'blue';  // Normal range
    if (temp <= q1) color = 'green';  // Low range
    else if (temp >= q3) color = 'red';  // High range
    
    return <Tag color={color}>{temp}</Tag>;
  };

  // Base columns without temperature zones
  const baseColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <DatePicker
            onChange={(date) => setSelectedKeys(date ? [date.format('YYYY-MM-DD')] : [])}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} size="small">Filter</Button>
            <Button onClick={clearFilters} size="small">Reset</Button>
          </Space>
        </div>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      sorter: (a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time),
      render: (text) => dayjs(text, 'HH:mm:ss').format('HH:mm:ss'),
    },
  ];

  // Temperature zone columns based on selection
  const temperatureColumns = selectedZones.map(zoneNum => ({
    title: `Zone ${zoneNum}`,
    dataIndex: `T${zoneNum}`,
    key: `T${zoneNum}`,
    sorter: (a, b) => a[`T${zoneNum}`] - b[`T${zoneNum}`],
    render: renderTemperature,
    filters: getTemperatureFilters(),
    onFilter: (value, record) => {
      const temp = record[`T${zoneNum}`];
      return temp >= value[0] && temp <= value[1];
    },
    width: 100,
  }));

  // Additional columns after temperature zones
  const additionalColumns = [
    {
      title: 'Events',
      dataIndex: 'events',
      key: 'events',
      sorter: (a, b) => a.events - b.events,
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
      sorter: (a, b) => a.blowerRunTime - b.blowerRunTime,
      render: (value) => value ? `${value} min` : '-',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <InputNumber
            placeholder="Min time"
            value={selectedKeys[0]}
            onChange={val => setSelectedKeys(val ? [val] : [])}
            style={{ marginBottom: 8, display: 'block', width: 100 }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
            >
              Filter
            </Button>
            <Button onClick={clearFilters} size="small">
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => record.blowerRunTime >= value,
    },
    {
      title: 'Push Time (Norm)',
      dataIndex: 'pushTimeNormalizing',
      key: 'pushTimeNormalizing',
      sorter: (a, b) => a.pushTimeNormalizing - b.pushTimeNormalizing,
      render: (value) => value ? `${value} min` : '-',
    },
    {
      title: 'Preheat Time (Norm)',
      dataIndex: 'preheatingTimeNormalizing',
      key: 'preheatingTimeNormalizing',
      sorter: (a, b) => a.preheatingTimeNormalizing - b.preheatingTimeNormalizing,
      render: (value) => value ? `${value} min` : '-',
    },
    {
      title: 'Socking Time (Norm)',
      dataIndex: 'sockingTimeNormalizing',
      key: 'sockingTimeNormalizing',
      sorter: (a, b) => a.sockingTimeNormalizing - b.sockingTimeNormalizing,
      render: (value) => value ? `${value} min` : '-',
    },
  ];

  // Combine all columns
  const columns = [...baseColumns, ...temperatureColumns, ...additionalColumns];

  return (
    <Card title="Temperature Data Table">
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space align="center">
          <Text strong>Select Temperature Zones:</Text>
          <Select
            mode="multiple"
            style={{ minWidth: 300 }}
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
        </Space>
        {data.length > 0 && (
          <Space>
            <Text type="secondary">
              Temperature Ranges - Low: ≤{temperatureStats.q1.toFixed(2)}, 
              Normal: {temperatureStats.q1.toFixed(2)}-{temperatureStats.q3.toFixed(2)}, 
              High: ≥{temperatureStats.q3.toFixed(2)}
            </Text>
          </Space>
        )}
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        onChange={handleChange}
        scroll={{ x: 'max-content' }}
        size="small"
        pagination={{
          defaultPageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['10', '50', '100', '500'],
          position: ['topLeft'],
          style: { marginBottom: 16 }
        }}
      />
    </Card>
  );
}

export default TabularView; 