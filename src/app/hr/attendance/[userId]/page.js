// src/app/hr/attendance/[userId]/page.js
"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, use } from "react";
import { useAuth } from "@/lib/useAuth";

// Status colors
const statusColors = {
  logged: 'bg-emerald-100',
  calculating: 'bg-blue-100',
  holiday: 'bg-gray-100',
  absent: 'bg-rose-100',
  leave: 'bg-yellow-100',
  default: 'bg-white'
};

export default function UserAttendanceDetails({ params }) {
  const { userId } = use(params);
  const { token } = useAuth();
  
  const [userData, setUserData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [checkInLocation, setCheckInLocation] = useState(null);
  const [checkOutLocation, setCheckOutLocation] = useState(null);
  const [isLocLoading, setIsLocLoading] = useState(false);
  
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedDate) {
        setCheckInLocation(null);
        setCheckOutLocation(null);
        return;
      }
      setIsLocLoading(true);
      try {
        if (selectedDate.checkInLat && selectedDate.checkInLng) {
          const inRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedDate.checkInLat}&lon=${selectedDate.checkInLng}`);
          const inData = await inRes.json();
          setCheckInLocation(inData.display_name || "Unknown");
        } else {
          setCheckInLocation("Location not recorded");
        }

        if (selectedDate.checkOutLat && selectedDate.checkOutLng) {
          const outRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedDate.checkOutLat}&lon=${selectedDate.checkOutLng}`);
          const outData = await outRes.json();
          setCheckOutLocation(outData.display_name || "Unknown");
        } else {
          setCheckOutLocation("Location not recorded");
        }
      } catch(e) {
        console.error("Location fetch error", e);
        setCheckInLocation("Failed to load");
        setCheckOutLocation("Failed to load");
      } finally {
        setIsLocLoading(false);
      }
    };
    fetchLocations();
  }, [selectedDate]);
  
  useEffect(() => {
    if (token && userId) {
      fetchUserLogs();
    }
  }, [token, userId]);

  const fetchUserLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserData(data.user);
        setAttendanceData(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Process data for the selected month
  const processedData = useMemo(() => {
    const processed = {};
    attendanceData.forEach(item => {
      // Use exact logdate if available, fallback to createdAt formatted as YYYY-MM-DD
      let dateKey = item.logdate;
      if (!dateKey) {
        const d = new Date(item.createdAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateKey = `${yyyy}-${mm}-${dd}`;
      }
      const workStatusLower = (item.workstatus || "").toLowerCase();
      
      let status = "absent";
      if (workStatusLower.includes("log") || workStatusLower.includes("work") || workStatusLower.includes("check")) status = "logged";
      else if (workStatusLower.includes("calc")) status = "calculating";
      else if (workStatusLower.includes("hol")) status = "holiday";
      else if (workStatusLower.includes("leav")) status = "leave";
      
      processed[dateKey] = {
        ...item,
        status,
        taskDetails: item.taskDetails || []
      };
    });
    return processed;
  }, [attendanceData]);

  // Analytics for current month
  const analytics = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let loggedDays = 0, absentDays = 0, leaveDays = 0, holidayDays = 0;
    let totalInMins = 0, inCount = 0;
    let totalOutMins = 0, outCount = 0;
    let tasksCompleted = 0, tasksTotal = 0;

    const now = new Date();
    const isCurrentMonthAndYear = year === now.getFullYear() && month === now.getMonth();
    const calculationLimitDay = isCurrentMonthAndYear ? now.getDate() : daysInMonth;

    for (let day = 1; day <= daysInMonth; day++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateKey1 = `${yyyy}-${mm}-${dd}`; // standard YYYY-MM-DD
      const dateKey2 = `${month+1}/${day}/${year}`; // fallback
      const dateKey3 = new Date(year, month, day).toLocaleDateString('en-US'); // fallback 2
      
      const dayData = processedData[dateKey1] || processedData[dateKey2] || processedData[dateKey3] || null;
      if (dayData) {
        if (dayData.status === 'logged') loggedDays++;
        else if (dayData.status === 'leave') leaveDays++;
        else if (dayData.status === 'holiday') holidayDays++;
        else absentDays++;

        if (Array.isArray(dayData.taskDetails)) {
          tasksTotal += dayData.taskDetails.length;
          tasksCompleted += dayData.taskDetails.filter(t => t.completed).length;
        }

        const parseTime = (timeStr) => {
          if (!timeStr || timeStr === "N/A" || !timeStr.includes(':')) return null;
          try {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            hours = parseInt(hours, 10);
            if (hours === 12) hours = 0;
            if (modifier && modifier.toUpperCase() === 'PM') hours += 12;
            return hours * 60 + parseInt(minutes, 10);
          } catch(e) { return null; }
        };

        const inMins = parseTime(dayData.intimelog);
        if (inMins !== null) { totalInMins += inMins; inCount++; }
        
        const outMins = parseTime(dayData.outtimelog);
        if (outMins !== null) { totalOutMins += outMins; outCount++; }
      } else {
        const dateObj = new Date(year, month, day);
        const isWeekend = dateObj.getDay() === 0;
        if (isWeekend) {
          holidayDays++; // Count weekends as holidays
        } else if (day < calculationLimitDay) {
          // If it's a past weekday with no data, it's an absent day
          absentDays++;
        } else if (day === calculationLimitDay) {
          // If it's today, we might consider it absent if the day is mostly over
          // but for simplicity, we count it as absent if no log exists today.
          absentDays++;
        }
      }
    }

    const formatAvg = (total, count) => {
      if (count === 0) return 'N/A';
      const avg = Math.round(total / count);
      let h = Math.floor(avg / 60);
      let m = avg % 60;
      let mod = 'AM';
      if (h >= 12) { mod = 'PM'; if (h > 12) h -= 12; }
      if (h === 0) h = 12;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${mod}`;
    };

    const denominator = daysInMonth - holidayDays - leaveDays;
    const attendancePercentage = denominator > 0 ? Math.round((loggedDays / denominator) * 100) : 0;

    return {
      totalDays: daysInMonth,
      loggedDays,
      absentDays,
      leaveDays,
      holidayDays,
      tasksCompleted,
      tasksTotal,
      attendancePercentage: Math.min(100, attendancePercentage),
      averageCheckInTime: formatAvg(totalInMins, inCount),
      averageCheckOutTime: formatAvg(totalOutMins, outCount)
    };
  }, [processedData, currentDate]);

  // Exports
  const exportCSV = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rows = [['Date', 'Status', 'Login Time', 'Logout Time', 'Work Hours', 'Tasks']];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateKey1 = `${yyyy}-${mm}-${dd}`;
      const dateKey2 = `${month+1}/${day}/${year}`;
      const dateKey3 = new Date(year, month, day).toLocaleDateString('en-US');
      const data = processedData[dateKey1] || processedData[dateKey2] || processedData[dateKey3];
      
      if (data) {
        const tasks = Array.isArray(data.taskDetails)
          ? data.taskDetails.map(t => {
              const statusStr = t.completed
                ? `Completed${t.completionDate ? ` on ${new Date(t.completionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}`
                : 'Pending';
              const descPart = t.description ? ` - ${t.description}` : '';
              return `${t.text}${descPart} (${statusStr})`;
            }).join('; ')
          : '';
        rows.push([
          dateKey1,
          data.status,
          data.intimelog || 'N/A',
          data.outtimelog || 'N/A',
          data.workhours || 'N/A',
          `"${tasks.replace(/"/g, '""')}"`
        ]);
      } else {
        rows.push([dateKey1, 'No Data', 'N/A', 'N/A', 'N/A', '']);
      }
    }
    
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${userData?.name}_${year}-${month+1}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF.default();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        doc.setFontSize(18);
        doc.text(`Attendance Report - ${userData?.name} - ${month+1}/${year}`, 14, 20);
        
        doc.setFontSize(12);
        doc.text(`Total Days: ${analytics.totalDays}`, 14, 30);
        doc.text(`Days Present: ${analytics.loggedDays}`, 14, 36);
        doc.text(`Absent Days: ${analytics.absentDays}`, 14, 42);
        doc.text(`Attendance %: ${analytics.attendancePercentage}%`, 14, 48);
        doc.text(`Average Check-in: ${analytics.averageCheckInTime}`, 14, 54);
        doc.text(`Average Check-out: ${analytics.averageCheckOutTime}`, 14, 60);

        const tableColumn = ['Date', 'Status', 'Login Time', 'Logout Time', 'Work Hours', 'Tasks'];
        const tableRows = [];
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const yyyy = year;
          const mm = String(month + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const dateKey1 = `${yyyy}-${mm}-${dd}`;
          const dateKey2 = `${month+1}/${day}/${year}`;
          const dateKey3 = new Date(year, month, day).toLocaleDateString('en-US');
          const data = processedData[dateKey1] || processedData[dateKey2] || processedData[dateKey3];
          
          if (data) {
            const tasks = Array.isArray(data.taskDetails) && data.taskDetails.length > 0
              ? data.taskDetails.map(t => {
                  const statusStr = t.completed
                    ? `Completed${t.completionDate ? ` on ${new Date(t.completionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}`
                    : 'Pending';
                  const descPart = t.description ? ` - ${t.description}` : '';
                  return `• ${t.text}${descPart} (${statusStr})`;
                }).join('\n')
              : 'No tasks';
            tableRows.push([
              dateKey1,
              data.status,
              data.intimelog || 'N/A',
              data.outtimelog || 'N/A',
              data.workhours || 'N/A',
              tasks
            ]);
          } else {
            tableRows.push([dateKey1, 'No Data', 'N/A', 'N/A', 'N/A', '']);
          }
        }

        autoTable.default(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 70,
          theme: 'grid',
          headStyles: { fillColor: [22, 163, 74] },
          styles: { cellPadding: 3, fontSize: 8 }
        });

        doc.save(`attendance_${userData?.name}_${year}-${month+1}.pdf`);
      }).catch(err => {
        alert('PDF export requires additional libraries. Run: npm install jspdf jspdf-autotable');
      });
    }).catch(err => {
      alert('PDF export requires additional libraries. Run: npm install jspdf jspdf-autotable');
    });
  };

  const handleMonthChange = (dir) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  };
  const handleYearChange = (dir) => {
    setCurrentDate(new Date(currentDate.getFullYear() + dir, currentDate.getMonth(), 1));
  };

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (isLoading) return <div className="p-10 text-center text-slate-500">Loading details...</div>;
  if (!userData) return <div className="p-10 text-center text-slate-500">User not found.</div>;

  return (
    <div className="p-6 md:p-10 flex-grow flex flex-col overflow-y-auto max-w-7xl mx-auto w-full font-sans bg-gray-50/50">
      <Link href="/hr" className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-6 group w-fit">
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform tracking-normal font-bold">arrow_back</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to HR Management</span>
      </Link>

      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-headline font-semibold text-on-surface mb-2">Employee: {userData.name}</h2>
        <p className="text-sm text-on-surface-variant font-medium">{userData.email} • {userData.department || "Unassigned"}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Monthly Analytics</h2>
          <div className="flex space-x-2">
            <button onClick={exportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold transition-colors cursor-pointer">Export CSV</button>
            <button onClick={exportPDF} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-semibold transition-colors cursor-pointer">Export PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Days</p>
            <p className="text-2xl font-bold text-blue-700">{analytics.totalDays}</p>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Days Present</p>
            <p className="text-2xl font-bold text-emerald-700">{analytics.loggedDays}</p>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Absent Days</p>
            <p className="text-2xl font-bold text-rose-700">{analytics.absentDays}</p>
          </div>
          <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Attendance %</p>
            <p className="text-2xl font-bold text-purple-700">{analytics.attendancePercentage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Average Check-in</p>
            <p className="text-lg font-bold text-slate-800">{analytics.averageCheckInTime}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Average Check-out</p>
            <p className="text-lg font-bold text-slate-800">{analytics.averageCheckOutTime}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Tasks Completed</p>
            <p className="text-lg font-bold text-slate-800">{analytics.tasksCompleted} / {analytics.tasksTotal}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase">Leave / Holiday</p>
            <p className="text-lg font-bold text-slate-800">{analytics.leaveDays + analytics.holidayDays}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Monthly Attendance - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => handleYearChange(-1)} className="p-2 rounded-md hover:bg-white text-slate-600 font-bold text-sm transition-colors cursor-pointer">&lt;&lt;</button>
            <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-md hover:bg-white text-slate-600 font-bold text-sm transition-colors cursor-pointer">&lt;</button>
            <span className="font-semibold text-slate-800 px-4 text-sm">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => handleMonthChange(1)} className="p-2 rounded-md hover:bg-white text-slate-600 font-bold text-sm transition-colors cursor-pointer">&gt;</button>
            <button onClick={() => handleYearChange(1)} className="p-2 rounded-md hover:bg-white text-slate-600 font-bold text-sm transition-colors cursor-pointer">&gt;&gt;</button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200 bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0">
            {[...Array(firstDayOfMonth)].map((_, index) => (
              <div key={`empty-${index}`} className="h-28 border-r border-b border-gray-100 bg-gray-50/50"></div>
            ))}

            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const yyyy = currentDate.getFullYear();
              const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const dateKey1 = `${yyyy}-${mm}-${dd}`;
              const dateKey2 = `${currentDate.getMonth()+1}/${day}/${currentDate.getFullYear()}`;
              const dateKey3 = new Date(yyyy, currentDate.getMonth(), day).toLocaleDateString('en-US');
              const dayData = processedData[dateKey1] || processedData[dateKey2] || processedData[dateKey3] || null;
              
              const now = new Date();
              const todayYyyy = now.getFullYear();
              const todayMm = String(now.getMonth() + 1).padStart(2, '0');
              const todayDd = String(now.getDate()).padStart(2, '0');
              const isToday = `${todayYyyy}-${todayMm}-${todayDd}` === dateKey1;
              
              const dateObj = new Date(yyyy, currentDate.getMonth(), day);
              const isWeekend = dateObj.getDay() === 0;
              const colorClass = dayData ? (statusColors[dayData.status] || statusColors.default) : (isWeekend ? statusColors.holiday : statusColors.default);

              return (
                <div
                  key={day}
                  onClick={() => dayData && setSelectedDate(dayData)}
                  className={`h-28 border-r border-b border-gray-100 p-2 relative flex flex-col group ${colorClass} ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''} ${dayData ? 'cursor-pointer hover:opacity-90' : ''}`}
                >
                  <span className={`text-sm font-semibold self-end mb-1 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                    {day}
                  </span>
                  
                  {!dayData && isWeekend && (
                    <div className="flex flex-col gap-1 mt-auto items-center justify-center h-full opacity-50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Weekend
                      </span>
                    </div>
                  )}

                  {dayData && (
                    <div className="flex flex-col gap-1 mt-auto">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-white/60 px-1.5 py-0.5 rounded w-fit">
                        {dayData.status}
                      </span>
                      {dayData.intimelog && (
                         <span className="text-[10px] font-medium text-slate-600 truncate">{dayData.intimelog} - {dayData.outtimelog || '...'}</span>
                      )}
                    </div>
                  )}
                  {dayData && Array.isArray(dayData.taskDetails) && dayData.taskDetails.length > 0 && (() => {
                     const completed = dayData.taskDetails.filter(t => t.completed).length;
                     const pending = dayData.taskDetails.length - completed;
                     return (
                       <div className="absolute top-2 left-2 flex gap-1">
                         {pending > 0 && (
                           <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm" title={`${pending} pending`}>
                             {pending}P
                           </span>
                         )}
                         {completed > 0 && (
                           <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm" title={`${completed} completed`}>
                             {completed}C
                           </span>
                         )}
                       </div>
                     );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Details for {selectedDate.logdate || new Date(selectedDate.createdAt).toLocaleDateString()}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Check In</p>
                <p className="font-bold text-gray-800">{selectedDate.intimelog || 'N/A'}</p>
                <p className="text-[10px] text-gray-500 mt-2 leading-tight" title={checkInLocation}>{isLocLoading ? 'Loading location...' : checkInLocation}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Check Out</p>
                <p className="font-bold text-gray-800">{selectedDate.outtimelog || 'N/A'}</p>
                <p className="text-[10px] text-gray-500 mt-2 leading-tight" title={checkOutLocation}>{isLocLoading ? 'Loading location...' : checkOutLocation}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg col-span-2 flex justify-between items-center">
                 <div>
                   <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Work Hours</p>
                   <p className="font-bold text-gray-800">{selectedDate.workhours || 'N/A'}</p>
                 </div>
                 <div>
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-white shadow-sm border border-gray-200 px-2 py-1 rounded">
                     {selectedDate.status}
                   </span>
                 </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-gray-800 mb-3">Daily Tasks Recorded</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar bg-gray-50 p-3 rounded-lg border border-gray-100">
                {Array.isArray(selectedDate.taskDetails) && selectedDate.taskDetails.length > 0 ? (
                  selectedDate.taskDetails.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className={`material-symbols-outlined text-[18px] ${task.completed ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {task.completed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <div className="flex flex-col">
                        <span className={task.completed ? 'line-through text-gray-500 font-normal' : 'text-gray-800 font-semibold'}>{task.text}</span>
                        {task.description && (
                          <span className="text-xs text-slate-500 mt-0.5">{task.description}</span>
                        )}
                        {task.completed && task.completionDate && (
                          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                            Completed on {new Date(task.completionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No tasks recorded on this day.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
