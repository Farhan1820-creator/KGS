import { users } from '@/db/schema';

import React from 'react'

type AdminDashboardProps = {
  name: undefined;
};

const AdminDashboard = ({ name }: AdminDashboardProps) => {
  return (
    <div className="text-3xl text-center py-6 w-full flex items-center justify-center">
      <h2>Hi, {name}</h2>
      </div>
  )
}

export default AdminDashboard