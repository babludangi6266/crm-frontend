import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import api from '../../services/api';
import toast from 'react-hot-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSelector } from 'react-redux';

const localizer = momentLocalizer(moment);


const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, reportsRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/reports')
        ]);
        
        const formattedEvents = [];
        
        tasksRes.data.forEach(task => {
          if (!task.dueDate) return;
          const date = new Date(task.dueDate);
          formattedEvents.push({
            id: `task-${task._id}`,
            title: `Task: ${task.title} (${task.status.toUpperCase()})`,
            start: date,
            end: date,
            allDay: true,
            type: 'task',
            resource: task
          });
        });

        reportsRes.data.forEach(report => {
          if (!report.date) return;
          const date = new Date(report.date);
          formattedEvents.push({
            id: `report-${report._id}`,
            title: userInfo.role === 'admin' ? `Report: ${report.employee?.name}` : `Daily Report`,
            start: date,
            end: date,
            allDay: true,
            type: 'report',
            resource: report
          });
        });

        setEvents(formattedEvents);
      } catch (error) {
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userInfo.role]);

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    if (event.type === 'report') {
       backgroundColor = '#8b5cf6'; // violet for reports
    } else {
       if (event.resource.status === 'completed') backgroundColor = '#14b8a6'; // teal
       if (event.resource.status === 'pending') backgroundColor = '#6b7280'; // gray
       if (event.resource.status === 'inprogress') backgroundColor = '#3b82f6'; // blue
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 5px'
      }
    };
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800">Task Calendar</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-grow" style={{ minHeight: '600px' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-500">Loading events...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', minHeight: '500px' }}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'agenda']}
            tooltipAccessor={(e) => {
               if (e.type === 'report') return e.resource.content;
               return `${e.resource.title}\nPriority: ${e.resource.priority}\nProject: ${e.resource.project?.name || 'N/A'}`;
            }}
            popup
          />
        )}
      </div>
      {/* Overriding some default react-big-calendar styles to match our theme */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .rbc-month-view { border-radius: 8px; border-color: #f3f4f6; }
        .rbc-header { padding: 8px; font-weight: 600; font-size: 13px; color: #4b5563; }
        .rbc-off-range-bg { background-color: #f9fafb; }
        .rbc-today { background-color: #fffbeb; }
      `}} />
    </div>
  );
};

export default CalendarView;
