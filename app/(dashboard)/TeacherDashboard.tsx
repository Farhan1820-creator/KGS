import React from 'react'

type TeacherDashboardProps = {
  name: undefined;
};

const TeacherDashboard = ({name}:TeacherDashboardProps) => {
  return (
    <div className="text-3xl text-center py-6 w-full flex items-center justify-center">
      <h2>Hi, {name}</h2>
      </div>  )
}

export default TeacherDashboard