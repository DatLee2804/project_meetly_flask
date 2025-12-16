// src/components/shared/TimelineView.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Video, CheckSquare } from 'lucide-react';
import { Task, Meeting } from '../../types';

type TimelineScope = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

interface TimelineViewProps {
    tasks: Task[];
    meetings: Meeting[]; // <--- THÊM PROP NÀY
}

const TimelineView: React.FC<TimelineViewProps> = ({ tasks, meetings = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scope, setScope] = useState<TimelineScope>('MONTH');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // --- Helpers ---
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const val = direction === 'next' ? 1 : -1;
    
    if (scope === 'DAY') newDate.setDate(newDate.getDate() + val);
    else if (scope === 'WEEK') newDate.setDate(newDate.getDate() + (val * 7));
    else if (scope === 'MONTH') newDate.setMonth(newDate.getMonth() + val);
    else if (scope === 'YEAR') newDate.setFullYear(newDate.getFullYear() + val);
    
    setCurrentDate(newDate);
  }

  const getHeaderText = () => {
    if (scope === 'DAY') return currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (scope === 'WEEK') {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (scope === 'MONTH') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (scope === 'YEAR') return `${currentDate.getFullYear()}`;
    return '';
  }

  const formatTime = (isoString: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- Logic gộp Task và Meeting cho 1 ngày ---
  const getEventsForDay = (date: Date) => {
      const dayStr = date.toISOString().split('T')[0];
      
      // 1. Lọc Task (theo dueDate)
      const dayTasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(dayStr)).map(t => ({
          type: 'TASK',
          data: t,
          time: t.dueDate ? new Date(t.dueDate).getTime() : 0, // Dùng để sort
          displayTime: 'Due ' + formatTime(t.dueDate!)
      }));

      // 2. Lọc Meeting (theo startDate)
      const dayMeetings = meetings.filter(m => m.startDate && m.startDate.startsWith(dayStr)).map(m => ({
          type: 'MEETING',
          data: m,
          time: new Date(m.startDate).getTime(),
          displayTime: formatTime(m.startDate)
      }));

      // 3. Gộp và Sort theo thời gian tăng dần
      return [...dayMeetings, ...dayTasks].sort((a, b) => a.time - b.time);
  };

  // --- VIEW 1: MONTH (Lưới lịch) ---
  const renderMonthGrid = (date: Date, mini = false) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    
    const days = [];
    for(let i=0; i<firstDay; i++) days.push(null);
    for(let i=1; i<=daysInMonth; i++) days.push(new Date(year, month, i));
    while(days.length % 7 !== 0) days.push(null);

    return (
        <div className={`grid grid-cols-7 ${mini ? 'gap-1' : 'auto-rows-fr bg-white h-full border-l border-t border-slate-200'}`}>
             {!mini && ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                 <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 border-b border-r border-slate-200 bg-slate-50">{d}</div>
             ))}
             {days.map((d, idx) => {
                 if(!d) return <div key={idx} className={`${mini ? '' : 'bg-slate-50/30 border-b border-r border-slate-200'}`}></div>
                 
                 const events = getEventsForDay(d);
                 const isToday = d.toDateString() === new Date().toDateString();
                 const isSelected = d.toDateString() === currentDate.toDateString();

                 // Mini View (Cho Year View)
                 if (mini) {
                    return (
                        <div key={idx} className={`aspect-square flex items-center justify-center relative rounded hover:bg-slate-100 cursor-pointer ${events.length > 0 ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
                            <span className={`text-[10px] ${isToday ? 'text-indigo-600 font-bold' : ''}`}>{d.getDate()}</span>
                            {events.length > 0 && <div className="absolute bottom-0.5 w-1 h-1 bg-indigo-500 rounded-full"></div>}
                        </div>
                    )
                 }

                 // Full Month View
                 return (
                     <div key={idx} className={`border-b border-r border-slate-200 p-2 min-h-[100px] relative hover:bg-slate-50 transition group ${isSelected ? 'bg-indigo-50/30' : ''}`}
                          onClick={() => { setCurrentDate(d); setScope('DAY'); }}>
                         <div className="flex justify-between items-start mb-1">
                             <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}`}>
                                 {d.getDate()}
                             </span>
                             {events.length > 0 && <span className="text-xs text-slate-400 font-medium">{events.length} items</span>}
                         </div>
                         
                         {/* Render List Items */}
                         <div className="space-y-1 overflow-y-auto max-h-[80px] hide-scrollbar">
                             {events.map((e: any) => (
                                 <div key={e.type === 'TASK' ? e.data.id : e.data.id} 
                                      className={`text-[10px] px-2 py-1 rounded truncate border shadow-sm cursor-pointer transition hover:scale-[1.02] flex items-center gap-1 ${
                                     e.type === 'MEETING' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                     e.data.priority === 'High' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-white border-slate-200 text-slate-700'
                                 }`}>
                                     {/* Icon phân biệt */}
                                     {e.type === 'MEETING' ? <Video size={10} className="flex-shrink-0"/> : <CheckSquare size={10} className="flex-shrink-0 opacity-50"/>}
                                     
                                     {/* Hiển thị giờ cho Meeting */}
                                     {e.type === 'MEETING' && <span className="font-bold mr-1">{e.displayTime}</span>}
                                     
                                     <span className="truncate">{e.data.title}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )
             })}
        </div>
    )
  };

  // --- VIEW 2: WEEK (7 Cột dọc) ---
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];
    for(let i=0; i<7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        weekDays.push(d);
    }

    return (
        <div className="grid grid-cols-7 h-full bg-white divide-x divide-slate-200 border-t border-slate-200">
             {weekDays.map((d, idx) => {
                 const events = getEventsForDay(d);
                 const isToday = d.toDateString() === new Date().toDateString();

                 return (
                     <div key={idx} className="flex flex-col h-full hover:bg-slate-50/50 transition">
                         {/* Header Ngày */}
                         <div className={`p-4 text-center border-b border-slate-200 ${isToday ? 'bg-indigo-50' : ''}`}>
                             <div className={`text-xs uppercase font-bold mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {d.toLocaleDateString(undefined, {weekday: 'short'})}
                             </div>
                             <div className={`text-2xl font-bold w-10 h-10 mx-auto flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-800'}`}>
                                 {d.getDate()}
                             </div>
                         </div>
                         
                         {/* Body List */}
                         <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                             {events.map((e: any) => (
                                 <div key={e.data.id} className={`p-2 rounded border shadow-sm text-xs cursor-pointer border-l-4 ${
                                     e.type === 'MEETING' 
                                        ? 'bg-indigo-50 border-indigo-200 border-l-indigo-500' 
                                        : 'bg-white border-slate-200 border-l-slate-300'
                                 }`}>
                                     <div className="flex justify-between items-center mb-1 text-[10px] font-bold opacity-70">
                                         <span className="flex items-center gap-1">
                                            {e.type === 'MEETING' ? <Video size={10}/> : <Clock size={10}/>}
                                            {e.displayTime}
                                         </span>
                                     </div>
                                     <div className="font-semibold text-slate-800 line-clamp-2">{e.data.title}</div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )
             })}
        </div>
    )
  };

  // --- VIEW 3: DAY (Chi tiết theo giờ) ---
  const renderDayView = () => {
      const events = getEventsForDay(currentDate);

      return (
          <div className="flex flex-col h-full bg-white p-8 max-w-5xl mx-auto w-full overflow-y-auto">
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg"><Calendar size={24}/></span>
                  Schedule for {currentDate.toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}
              </h3>
              
              {events.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <Clock size={48} className="mb-4 opacity-50"/>
                      <p className="text-lg font-medium">No events scheduled for today.</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {events.map((e: any) => (
                          <div key={e.data.id} className={`flex gap-6 p-5 border rounded-xl hover:shadow-md transition group ${
                              e.type === 'MEETING' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-200'
                          }`}>
                              {/* Cột thời gian */}
                              <div className="flex-shrink-0 w-24 text-center pt-1 border-r border-slate-200/50 pr-6">
                                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                                      {e.type === 'MEETING' ? 'Starts At' : 'Due By'}
                                  </span>
                                  <span className={`text-lg font-bold ${e.type === 'MEETING' ? 'text-indigo-600' : 'text-slate-700'}`}>
                                      {e.displayTime}
                                  </span>
                              </div>

                              {/* Nội dung */}
                              <div className="flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                          {e.type === 'MEETING' && <Video size={20} className="text-indigo-500"/>}
                                          {e.data.title}
                                      </h4>
                                      {e.type === 'TASK' && (
                                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                              e.data.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                          }`}>
                                              {e.data.priority}
                                          </span>
                                      )}
                                      {e.type === 'MEETING' && (
                                          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                              Meeting
                                          </span>
                                      )}
                                  </div>
                                  <p className="text-sm text-slate-500 mb-3">{e.data.description || "No description provided."}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )
  };

  // --- VIEW 4: YEAR ---
  const renderYearView = () => {
      const year = currentDate.getFullYear();
      const months = Array.from({length: 12}, (_, i) => new Date(year, i, 1));
      
      return (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-8 h-full overflow-y-auto bg-slate-50">
              {months.map((m, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition cursor-pointer"
                       onClick={() => { setCurrentDate(m); setScope('MONTH'); }}>
                      <h4 className="font-bold text-slate-700 mb-3 pl-1">{m.toLocaleDateString(undefined, {month: 'long'})}</h4>
                      {renderMonthGrid(m, true)}
                  </div>
              ))}
          </div>
      )
  }

  return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Timeline Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
             <div className="flex items-center gap-6">
                 <h2 className="text-2xl font-bold text-slate-800 w-64">{getHeaderText()}</h2>
                 <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                     <button onClick={() => navigate('prev')} className="p-1.5 hover:bg-white rounded-md transition text-slate-600"><ChevronLeft size={20}/></button>
                     <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold hover:bg-white rounded-md text-slate-700 transition">Today</button>
                     <button onClick={() => navigate('next')} className="p-1.5 hover:bg-white rounded-md transition text-slate-600"><ChevronRight size={20} /></button>
                 </div>
             </div>
             
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                 {['DAY', 'WEEK', 'MONTH', 'YEAR'].map(s => (
                     <button key={s} onClick={() => setScope(s as TimelineScope)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${scope === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                         {s}
                     </button>
                 ))}
             </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-slate-50">
              {scope === 'MONTH' && renderMonthGrid(currentDate)}
              {scope === 'WEEK' && renderWeekView()}
              {scope === 'DAY' && renderDayView()}
              {scope === 'YEAR' && renderYearView()}
          </div>
      </div>
  )
};

export default TimelineView;