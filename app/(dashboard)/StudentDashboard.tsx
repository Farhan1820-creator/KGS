import React from 'react'

type StudentDashboardProps = {
  name?: string | null;
};

const StudentDashboard = ({name}:StudentDashboardProps) => {
  return (
    <div className="text-3xl text-center py-6 w-full flex items-center justify-center">
      <h2>Welcome
        <span className="text-primary font-bold">{name ? `, ${name}` : ""}</span></h2>
      </div>  )
}

export default StudentDashboard