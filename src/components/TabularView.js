import { Table, Card, Space, Button, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import 'antd/dist/reset.css';

function TabularView({ data, loading }) {
  const [searchText, setSearchText] = useState('');
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});

  const handleChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const clearFilters = () => {
    setFilteredInfo({});
  };

  const clearAll = () => {
    setFilteredInfo({});
    setSortedInfo({});
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      ...getColumnSearchProps('date'),
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      sorter: (a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time),
      ...getColumnSearchProps('time'),
    },
    ...Array.from({ length: 14 }, (_, i) => ({
      title: `T${i + 1}`,
      dataIndex: `T${i + 1}`,
      key: `T${i + 1}`,
      sorter: (a, b) => a[`T${i + 1}`] - b[`T${i + 1}`],
      render: (text) => text?.toFixed(2),
    })),
    {
      title: 'Events',
      dataIndex: 'events',
      key: 'events',
      sorter: (a, b) => a.events - b.events,
    },
    {
      title: 'Blower Run Time',
      dataIndex: 'blowerRunTime',
      key: 'blowerRunTime',
      sorter: (a, b) => a.blowerRunTime - b.blowerRunTime,
    },
    {
      title: 'Push Time (Norm)',
      dataIndex: 'pushTimeNormalizing',
      key: 'pushTimeNormalizing',
      sorter: (a, b) => a.pushTimeNormalizing - b.pushTimeNormalizing,
    },
    {
      title: 'Preheat Time (Norm)',
      dataIndex: 'preheatingTimeNormalizing',
      key: 'preheatingTimeNormalizing',
      sorter: (a, b) => a.preheatingTimeNormalizing - b.preheatingTimeNormalizing,
    },
    {
      title: 'Socking Time (Norm)',
      dataIndex: 'sockingTimeNormalizing',
      key: 'sockingTimeNormalizing',
      sorter: (a, b) => a.sockingTimeNormalizing - b.sockingTimeNormalizing,
    },
  ];

  return (
    <Card title="Temperature Data Table">
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={clearFilters}>Clear filters</Button>
        <Button onClick={clearAll}>Clear filters and sorters</Button>
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
        }}
      />
    </Card>
  );
}

export default TabularView; 