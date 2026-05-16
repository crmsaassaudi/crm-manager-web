import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        dashboard: 'Dashboard',
        tenants: 'Tenants',
        permissions: 'Permissions',
        settings: 'Settings',
        save: 'Save Changes',
        cancel: 'Cancel',
        search: 'Search...',
        active: 'Active',
        suspended: 'Suspended',
        pending: 'Pending',
      },
      dashboard: {
        title: 'Platform Overview',
        subtitle: 'Real-time health and performance metrics across all tenants.',
        totalTenants: 'Total Tenants',
        activeUsers: 'Active Users',
        storageUsage: 'Storage Usage',
        recentActivity: 'Recent Activity',
      },
      tenants: {
        title: 'Tenant Management',
        subtitle: 'Manage provisioning, features, and lifecycle for SaaS customers.',
        table: {
          name: 'Tenant Name',
          plan: 'Plan',
          status: 'Status',
          createdAt: 'Created At',
          actions: 'Actions',
        },
        bulkActions: 'Bulk Actions',
        applyTemplate: 'Apply Template',
      },
    },
  },
  vi: {
    translation: {
      common: {
        dashboard: 'Bảng điều khiển',
        tenants: 'Khách hàng (Tenants)',
        permissions: 'Phân quyền',
        settings: 'Cài đặt',
        save: 'Lưu thay đổi',
        cancel: 'Hủy',
        search: 'Tìm kiếm...',
        active: 'Hoạt động',
        suspended: 'Tạm ngưng',
        pending: 'Chờ xử lý',
      },
      dashboard: {
        title: 'Tổng quan hệ thống',
        subtitle: 'Số liệu sức khỏe và hiệu suất thời gian thực của toàn bộ hệ thống.',
        totalTenants: 'Tổng số Tenant',
        activeUsers: 'Người dùng đang hoạt động',
        storageUsage: 'Dung lượng lưu trữ',
        recentActivity: 'Hoạt động gần đây',
      },
      tenants: {
        title: 'Quản lý Tenant',
        subtitle: 'Quản lý cấp phát, tính năng và vòng đời của khách hàng SaaS.',
        table: {
          name: 'Tên Tenant',
          plan: 'Gói dịch vụ',
          status: 'Trạng thái',
          createdAt: 'Ngày tạo',
          actions: 'Hành động',
        },
        bulkActions: 'Hành động hàng loạt',
        applyTemplate: 'Áp dụng mẫu',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Default to VI as per plan
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
