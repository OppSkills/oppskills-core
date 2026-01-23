
export const mockUsers = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "User", status: "Inactive" },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "Organizer", status: "Active" },
    { id: 4, name: "Dana White", email: "dana@example.com", role: "User", status: "Active" },
    { id: 5, name: "Evan Wright", email: "evan@example.com", role: "User", status: "Suspended" },
];

export const mockEvents = [
    { id: 1, title: "Tech Talk 2024", date: "2024-03-15", location: "New York", organizer: "TechWorld", status: "Upcoming" },
    { id: 2, title: "Community Meetup", date: "2024-02-20", location: "San Francisco", organizer: "Devs United", status: "Completed" },
    { id: 3, title: "AI Workshop", date: "2024-04-10", location: "Online", organizer: "AI Hub", status: "Upcoming" },
];

export const mockHackathons = [
    { id: 1, title: "CodeBlast 2024", date: "2024-05-01", participants: 150, prizePool: "$5000", status: "Open" },
    { id: 2, title: "HackTheFuture", date: "2024-06-15", participants: 300, prizePool: "$10000", status: "Upcoming" },
];

export const mockFestivals = [
    { id: 1, title: "Summer Coding Fest", date: "2024-07-20", location: "London", attendees: 500 },
    { id: 2, title: "Winter Dev Gala", date: "2024-12-10", location: "Berlin", attendees: 400 },
];

export const mockPayments = [
    { id: 1, user: "Alice Johnson", amount: "$50.00", date: "2024-01-15", status: "Completed" },
    { id: 2, user: "Bob Smith", amount: "$25.00", date: "2024-01-18", status: "Pending" },
    { id: 3, user: "Charlie Brown", amount: "$100.00", date: "2024-01-20", status: "Completed" },
];

export const dashboardStats = [
    { title: "Total Users", value: "1,234", change: "+12%", icon: "Users" },
    { title: "Total Revenue", value: "$45,231", change: "+20%", icon: "DollarSign" },
    { title: "Active Events", value: "56", change: "+5%", icon: "Calendar" },
    { title: "New Signups", value: "123", change: "+8%", icon: "UserPlus" },
];
