export const people = [
  { id: 'USR-1001', name: 'Amina Bello', email: 'amina@example.com', role: 'Applicant', team: 'Alpha', status: 'Active', workload: 72, quality: 96, lastActive: '2 min ago' },
  { id: 'USR-1002', name: 'Chinedu Eze', email: 'chinedu@example.com', role: 'Applicant', team: 'Alpha', status: 'Active', workload: 54, quality: 92, lastActive: '11 min ago' },
  { id: 'USR-1003', name: 'Lola Mensah', email: 'lola@example.com', role: 'Applicant', team: 'Beta', status: 'At capacity', workload: 94, quality: 89, lastActive: '5 min ago' },
  { id: 'USR-1004', name: 'Tobi Akin', email: 'tobi@example.com', role: 'Prompt Engineer', team: 'Beta', status: 'Active', workload: 63, quality: 98, lastActive: '18 min ago' },
  { id: 'USR-1005', name: 'Nana Owusu', email: 'nana@example.com', role: 'Prompt Engineer', team: 'Gamma', status: 'Away', workload: 31, quality: 91, lastActive: '1 hr ago' },
  { id: 'USR-1006', name: 'Sarah Cole', email: 'sarah@example.com', role: 'Team Auditor', team: 'Quality', status: 'Active', workload: 68, quality: 97, lastActive: '4 min ago' },
  { id: 'USR-1007', name: 'David Kim', email: 'david@example.com', role: 'Chief Applicant', team: 'Operations', status: 'Active', workload: 46, quality: 95, lastActive: '8 min ago' },
  { id: 'USR-1008', name: 'Maya Patel', email: 'maya@example.com', role: 'Chief Auditor', team: 'Quality', status: 'Active', workload: 57, quality: 99, lastActive: '6 min ago' },
];

export const applications = [
  { id: 'APP-4832', applicant: 'Amina Bello', company: 'Stripe', position: 'Product Manager', country: 'United States', owner: 'Chinedu Eze', promptEngineer: 'Tobi Akin', auditor: 'Sarah Cole', status: 'Approved', priority: 'High', score: 96, created: 'Jul 27, 2026', updated: '12 min ago' },
  { id: 'APP-4831', applicant: 'Chinedu Eze', company: 'Shopify', position: 'Business Analyst', country: 'Canada', owner: 'Amina Bello', promptEngineer: 'Nana Owusu', auditor: 'Sarah Cole', status: 'In audit', priority: 'High', score: 91, created: 'Jul 27, 2026', updated: '24 min ago' },
  { id: 'APP-4830', applicant: 'Lola Mensah', company: 'Canva', position: 'Project Manager', country: 'Australia', owner: 'Chinedu Eze', promptEngineer: 'Tobi Akin', auditor: 'Maya Patel', status: 'Revision', priority: 'Medium', score: 78, created: 'Jul 27, 2026', updated: '37 min ago' },
  { id: 'APP-4829', applicant: 'Amina Bello', company: 'HubSpot', position: 'Customer Success Manager', country: 'United States', owner: 'Amina Bello', promptEngineer: 'Nana Owusu', auditor: 'Sarah Cole', status: 'Submitted', priority: 'Medium', score: 93, created: 'Jul 26, 2026', updated: '1 hr ago' },
  { id: 'APP-4828', applicant: 'Chinedu Eze', company: 'Datadog', position: 'Operations Analyst', country: 'United States', owner: 'Amina Bello', promptEngineer: 'Tobi Akin', auditor: 'Maya Patel', status: 'Draft', priority: 'Low', score: 84, created: 'Jul 26, 2026', updated: '2 hrs ago' },
  { id: 'APP-4827', applicant: 'Lola Mensah', company: 'Atlassian', position: 'Program Manager', country: 'United Kingdom', owner: 'Chinedu Eze', promptEngineer: 'Nana Owusu', auditor: 'Sarah Cole', status: 'Rejected', priority: 'Low', score: 88, created: 'Jul 25, 2026', updated: 'Yesterday' },
  { id: 'APP-4826', applicant: 'Amina Bello', company: 'Notion', position: 'Product Operations Manager', country: 'United States', owner: 'Amina Bello', promptEngineer: 'Tobi Akin', auditor: 'Maya Patel', status: 'Interview', priority: 'High', score: 97, created: 'Jul 25, 2026', updated: 'Yesterday' },
  { id: 'APP-4825', applicant: 'Chinedu Eze', company: 'Miro', position: 'Implementation Manager', country: 'Canada', owner: 'Chinedu Eze', promptEngineer: 'Nana Owusu', auditor: 'Sarah Cole', status: 'Offered', priority: 'High', score: 98, created: 'Jul 24, 2026', updated: '2 days ago' },
];

export const tasks = [
  { id: 'TSK-2098', application: 'APP-4832', company: 'Stripe', role: 'Product Manager', type: 'Resume + cover letter', priority: 'High', due: 'Today, 8:30 PM', status: 'In progress', progress: 72, quality: 96 },
  { id: 'TSK-2097', application: 'APP-4831', company: 'Shopify', role: 'Business Analyst', type: 'Resume', priority: 'High', due: 'Today, 9:15 PM', status: 'Ready for review', progress: 100, quality: 92 },
  { id: 'TSK-2096', application: 'APP-4830', company: 'Canva', role: 'Project Manager', type: 'Revision', priority: 'Medium', due: 'Tomorrow, 10:00 AM', status: 'Revision', progress: 43, quality: 78 },
  { id: 'TSK-2095', application: 'APP-4829', company: 'HubSpot', role: 'Customer Success Manager', type: 'Cover letter', priority: 'Medium', due: 'Tomorrow, 1:00 PM', status: 'Not started', progress: 0, quality: 0 },
  { id: 'TSK-2094', application: 'APP-4828', company: 'Datadog', role: 'Operations Analyst', type: 'Resume', priority: 'Low', due: 'Jul 29, 2:00 PM', status: 'Approved', progress: 100, quality: 95 },
];

export const audits = [
  { id: 'AUD-1328', application: 'APP-4831', company: 'Shopify', role: 'Business Analyst', engineer: 'Nana Owusu', submitted: '18 min ago', sla: '1h 42m', risk: 'Low', score: 92, status: 'Pending review' },
  { id: 'AUD-1327', application: 'APP-4830', company: 'Canva', role: 'Project Manager', engineer: 'Tobi Akin', submitted: '31 min ago', sla: '1h 29m', risk: 'High', score: 78, status: 'Escalated' },
  { id: 'AUD-1326', application: 'APP-4829', company: 'HubSpot', role: 'Customer Success Manager', engineer: 'Nana Owusu', submitted: '46 min ago', sla: '1h 14m', risk: 'Medium', score: 88, status: 'In review' },
  { id: 'AUD-1325', application: 'APP-4828', company: 'Datadog', role: 'Operations Analyst', engineer: 'Tobi Akin', submitted: '1 hr ago', sla: '53m', risk: 'Low', score: 95, status: 'Approved' },
  { id: 'AUD-1324', application: 'APP-4827', company: 'Atlassian', role: 'Program Manager', engineer: 'Nana Owusu', submitted: '2 hrs ago', sla: 'Overdue', risk: 'High', score: 71, status: 'Revision' },
];

export const activity = [
  { title: 'Application approved', detail: 'APP-4832 for Stripe passed final audit.', time: '12 minutes ago', tone: 'green' },
  { title: 'Audit escalated', detail: 'AUD-1327 needs a chief-auditor decision.', time: '31 minutes ago', tone: 'red' },
  { title: 'Task submitted', detail: 'Nana Owusu submitted APP-4831 for review.', time: '46 minutes ago', tone: 'blue' },
  { title: 'Applicant reached interview', detail: 'Amina Bello received an interview invitation from Notion.', time: '1 hour ago', tone: 'purple' },
  { title: 'New subscription', detail: 'A Premium plan was activated.', time: '2 hours ago', tone: 'amber' },
];

export const escalations = [
  { id: 'ESC-142', title: 'Unsupported metric in experience section', application: 'APP-4830', owner: 'Sarah Cole', severity: 'Critical', age: '31 min', status: 'Open' },
  { id: 'ESC-141', title: 'Job title changed beyond approved tailoring', application: 'APP-4827', owner: 'Maya Patel', severity: 'High', age: '2 hrs', status: 'Investigating' },
  { id: 'ESC-140', title: 'Duplicate application detected', application: 'APP-4819', owner: 'Sarah Cole', severity: 'Medium', age: '4 hrs', status: 'Resolved' },
];

export const subscriptions = [
  { id: 'SUB-3018', customer: 'Amina Bello', plan: 'Premium', price: '$250.00', renewal: 'Aug 18, 2026', usage: 78, status: 'Active' },
  { id: 'SUB-3017', customer: 'Chinedu Eze', plan: 'Standard', price: '$200.00', renewal: 'Aug 09, 2026', usage: 54, status: 'Active' },
  { id: 'SUB-3016', customer: 'Lola Mensah', plan: 'Basic', price: '$150.00', renewal: 'Aug 01, 2026', usage: 91, status: 'Past due' },
  { id: 'SUB-3015', customer: 'John Carter', plan: 'Premium', price: '$250.00', renewal: 'Sep 12, 2026', usage: 38, status: 'Paused' },
  { id: 'SUB-3014', customer: 'Maya Lewis', plan: 'Standard', price: '$200.00', renewal: 'Aug 27, 2026', usage: 67, status: 'Active' },
];

export const monthlyVolume = [38, 45, 51, 49, 58, 64, 71, 69, 82, 88, 94, 101];
export const monthlyRevenue = [8400, 9200, 10500, 11200, 12600, 13900, 15100, 16200, 17400, 18700, 19900, 21850];
export const qualityTrend = [91, 92, 90, 93, 94, 94, 95, 96, 95, 97, 96, 97];

export const reports = [
  { title: 'Weekly Operations Summary', description: 'Applications, throughput, capacity, and delivery outcomes.', format: 'PDF', lastRun: 'Jul 26, 2026' },
  { title: 'Quality and Audit Report', description: 'Defect trends, escalation causes, and auditor performance.', format: 'CSV', lastRun: 'Jul 25, 2026' },
  { title: 'Applicant Performance', description: 'Application volume, response rates, and interview outcomes.', format: 'XLSX', lastRun: 'Jul 24, 2026' },
  { title: 'Revenue and Subscriptions', description: 'MRR, plan mix, renewals, and payment status.', format: 'PDF', lastRun: 'Jul 23, 2026' },
];

export const messages = [
  { id: 1, name: 'Sarah Cole', role: 'Team Auditor', preview: 'Please check the metric in the third bullet.', time: '10:42 AM', unread: 2 },
  { id: 2, name: 'Amina Bello', role: 'Applicant', preview: 'I added the missing portfolio link.', time: 'Yesterday', unread: 0 },
  { id: 3, name: 'Maya Patel', role: 'Chief Auditor', preview: 'The revision is approved. Great work.', time: 'Monday', unread: 0 },
];
