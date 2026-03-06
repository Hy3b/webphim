import React from 'react';
import { DollarSign, ShoppingBag, UserPlus, RefreshCw } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/Dashboard/StatCard';
import RevenueChart from '../components/Dashboard/RevenueChart';

const data = [
  { time: '00:00', revenue: 0 },
  { time: '04:00', revenue: 829048 },
  { time: '08:00', revenue: 1200000 },
  { time: '12:00', revenue: 1658095 },
  { time: '16:00', revenue: 2487143 },
  { time: '20:00', revenue: 3000000 },
  { time: '24:00', revenue: 3316190 },
];

const DashboardPage = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Xin chào, Hoàn Trần!" 
        description="Sau đây là những gì đang diễn ra tại hệ thống của bạn." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Doanh thu" 
          value="4.10" unit="tr" 
          change="72.8" changeLabel="So với tháng trước" isPositive={false}
          icon={DollarSign} iconColor="text-teal-500" iconBg="bg-teal-50"
        />
        <StatCard 
          title="Tổng vé" 
          value="24" 
          change="76.9" changeLabel="So với tháng trước" isPositive={false}
          icon={ShoppingBag} iconColor="text-blue-500" iconBg="bg-blue-50"
        />
        <StatCard 
          title="Khách hàng mới" 
          value="1" 
          change="50" changeLabel="So với tháng trước" isPositive={false}
          icon={UserPlus} iconColor="text-orange-500" iconBg="bg-orange-50"
        />
        <StatCard 
          title="Tỷ lệ khách hàng quay lại" 
          value="100%" 
          changeLabel="Trong tháng 4-2025"
          icon={RefreshCw} iconColor="text-indigo-600" iconBg="bg-indigo-50"
        />
      </div>

      <RevenueChart data={data} title="Doanh thu theo thời gian" />
    </div>
  );
};

export default DashboardPage;
