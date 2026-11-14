import type { ResourceConfig } from "@/resources/management/types/resource.types";

const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }));
const courseTypes = ["theory", "lab", "combined"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));
const classTypes = ["theory", "lab"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }));

export const RESOURCE_GROUPS = ["Academic", "Tasks", "Reference data", "Access control"] as const;

export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    slug: "semesters", title: "Semesters", description: "Academic terms and their date ranges.", group: "Academic",
    columns: [{ key: "name", label: "Semester" }, { key: "academicYear", label: "Academic year" }, { key: "startDate", label: "Starts" }, { key: "endDate", label: "Ends" }],
    fields: [{ key: "name", label: "Semester name", type: "text", required: true }, { key: "academicYear", label: "Academic year", type: "text", required: true }, { key: "startDate", label: "Start date", type: "date", required: true }, { key: "endDate", label: "End date", type: "date", required: true }],
  },
  {
    slug: "courses", title: "Courses", description: "Course catalogue and assigned academic coordinators.", group: "Academic",
    columns: [{ key: "courseCode", label: "Course code" }, { key: "name", label: "Course" }, { key: "department", label: "Department" }, { key: "type", label: "Type" }, { key: "semester.name", label: "Semester" }],
    fields: [
      { key: "name", label: "Course name", type: "text", required: true }, { key: "courseCode", label: "Course code", type: "text", required: true }, { key: "department", label: "Department", type: "text", required: true },
      { key: "type", label: "Course type", type: "select", required: true, options: courseTypes }, { key: "credit", label: "Credit", type: "number", required: true },
      { key: "semesterId", label: "Semester", type: "select", required: true, optionsResource: "semesters", optionLabel: "name" },
      { key: "convenorId", label: "Convenor", type: "select", optionsResource: "users", optionLabel: "name" }, { key: "moderatorId", label: "Moderator", type: "select", optionsResource: "users", optionLabel: "name" }, { key: "externalId", label: "External expert", type: "select", optionsResource: "users", optionLabel: "name" },
    ], import: { requiredField: "semesterId", label: "Semester" },
  },
  {
    slug: "sections", title: "Sections", description: "Course sections, rooms, schedules, and assigned faculty.", group: "Academic",
    columns: [{ key: "name", label: "Section" }, { key: "course.name", label: "Course" }, { key: "semester.name", label: "Semester" }, { key: "user.name", label: "Faculty" }, { key: "room1", label: "Room" }],
    fields: [
      { key: "courseId", label: "Course", type: "select", required: true, optionsResource: "courses", optionLabel: "name" }, { key: "name", label: "Section name", type: "text", required: true },
      { key: "semesterId", label: "Semester", type: "select", required: true, optionsResource: "semesters", optionLabel: "name" }, { key: "userId", label: "Faculty member", type: "select", required: true, optionsResource: "users", optionLabel: "name" },
      { key: "room1", label: "Room 1", type: "text", required: true }, { key: "day1", label: "Day 1", type: "select", required: true, options: weekdays }, { key: "room2", label: "Room 2", type: "text" }, { key: "day2", label: "Day 2", type: "select", options: weekdays }, { key: "room3", label: "Room 3", type: "text" }, { key: "day3", label: "Day 3", type: "select", options: weekdays },
    ], import: { requiredField: "semesterId", label: "Semester" },
  },
  {
    slug: "tasks", title: "Tasks", description: "Academic and departmental work items, assignments, and due dates.", group: "Tasks",
    columns: [{ key: "name", label: "Task" }, { key: "status.name", label: "Status" }, { key: "category.name", label: "Category" }, { key: "assignee.name", label: "Assignee" }, { key: "dueDate", label: "Due date" }],
    fields: [
      { key: "name", label: "Task name", type: "text", required: true }, { key: "description", label: "Description", type: "textarea", required: true }, { key: "dueDate", label: "Due date", type: "date" }, { key: "userRemark", label: "User remark", type: "textarea" }, { key: "assigneeRemark", label: "Assignee remark", type: "textarea" },
      { key: "statusId", label: "Status", type: "select", required: true, optionsResource: "statuses", optionLabel: "name" }, { key: "categoryId", label: "Category", type: "select", required: true, optionsResource: "categories", optionLabel: "name" }, { key: "assigneeId", label: "Assignee", type: "select", required: true, optionsResource: "users", optionLabel: "name" },
      { key: "groupId", label: "Faculty group", type: "select", required: true, optionsResource: "faculty_groups", optionLabel: "name" }, { key: "semesterId", label: "Semester", type: "select", required: true, optionsResource: "semesters", optionLabel: "name" }, { key: "priorityId", label: "Priority", type: "select", required: true, optionsResource: "priorities", optionLabel: "name" },
    ],
  },
  {
    slug: "task_attachments", title: "Task attachments", description: "Files and references associated with tasks.", group: "Tasks",
    columns: [{ key: "task.name", label: "Task" }, { key: "attachmentPath", label: "Attachment path" }, { key: "createdAt", label: "Added" }],
    fields: [{ key: "taskId", label: "Task", type: "select", required: true, optionsResource: "tasks", optionLabel: "name" }, { key: "attachmentPath", label: "Attachment path or URL", type: "text", required: true }],
  },
  {
    slug: "class_cancellations", title: "Class cancellations", description: "Cancellation requests, makeup schedules, and approvals.", group: "Tasks",
    columns: [{ key: "course.name", label: "Course" }, { key: "section.name", label: "Section" }, { key: "cancellationDate", label: "Cancelled date" }, { key: "isApproved", label: "Approval" }, { key: "isAlreadyTaken", label: "Makeup taken" }],
    fields: [
      { key: "userId", label: "Faculty member", type: "select", required: true, optionsResource: "users", optionLabel: "name" }, { key: "classType", label: "Class type", type: "select", required: true, options: classTypes }, { key: "semesterId", label: "Semester", type: "select", required: true, optionsResource: "semesters", optionLabel: "name" }, { key: "courseId", label: "Course", type: "select", required: true, optionsResource: "courses", optionLabel: "name" }, { key: "sectionId", label: "Section", type: "select", required: true, optionsResource: "sections", optionLabel: "name" },
      { key: "reason", label: "Reason", type: "textarea", required: true }, { key: "cancellationDate", label: "Cancellation date", type: "date", required: true }, { key: "makeupClassDatetime", label: "Makeup class date and time", type: "datetime" }, { key: "makeupClassRoom", label: "Makeup room", type: "text" }, { key: "isAlreadyTaken", label: "Makeup already taken", type: "boolean" }, { key: "attachment", label: "Attachment URL", type: "text" }, { key: "supervisorRemark", label: "Supervisor remark", type: "textarea" }, { key: "isApproved", label: "Approved", type: "boolean" }, { key: "cancellationDay", label: "Cancelled day", type: "select", options: weekdays },
    ],
  },
  ...(["statuses", "categories", "priorities"] as const).map((slug) => ({
    slug, title: slug[0].toUpperCase() + slug.slice(1), description: `Manage the ${slug} available to academic workflows.`, group: "Reference data",
    columns: [{ key: "name", label: "Name" }, { key: "createdAt", label: "Created" }], fields: [{ key: "name", label: "Name", type: "text" as const, required: true }],
  })),
  {
    slug: "profiles", title: "Profiles", description: "Faculty contact and department information.", group: "Access control",
    columns: [{ key: "user.name", label: "User" }, { key: "department", label: "Department" }, { key: "faculty", label: "Faculty" }, { key: "phoneNumber", label: "Phone" }, { key: "status", label: "Status" }],
    fields: [
      { key: "userId", label: "User", type: "select", required: true, optionsResource: "users", optionLabel: "name" }, { key: "profileImage", label: "Profile image URL", type: "text" }, { key: "department", label: "Department", type: "text", required: true }, { key: "faculty", label: "Faculty", type: "text", required: true },
      { key: "type", label: "Employment type", type: "select", required: true, options: [{ value: "full-time", label: "Full time" }, { value: "part-time", label: "Part time" }] }, { key: "status", label: "Profile status", type: "select", required: true, options: [{ value: "active", label: "Active" }, { value: "on-leave", label: "On leave" }, { value: "resign", label: "Resigned" }] }, { key: "joiningDate", label: "Joining date", type: "date" }, { key: "phoneNumber", label: "Phone number", type: "text" },
    ],
  },
  {
    slug: "roles", title: "Roles", description: "Access roles assigned to users.", group: "Access control",
    columns: [{ key: "name", label: "Role" }, { key: "description", label: "Description" }, { key: "createdAt", label: "Created" }],
    fields: [{ key: "name", label: "Role name", type: "text", required: true }, { key: "description", label: "Description", type: "textarea" }],
  },
  {
    slug: "permissions", title: "Permissions", description: "Actions available to roles, grouped by module.", group: "Access control",
    columns: [{ key: "module", label: "Module" }, { key: "name", label: "Permission" }, { key: "description", label: "Description" }],
    fields: [{ key: "module", label: "Module", type: "text", required: true }, { key: "name", label: "Permission", type: "text", required: true }, { key: "description", label: "Description", type: "textarea" }],
  },
  {
    slug: "user_role_mappings", title: "User role assignments", description: "Grant roles to users; permissions flow from the role.", group: "Access control",
    columns: [{ key: "user.name", label: "User" }, { key: "role.name", label: "Role" }, { key: "createdAt", label: "Assigned" }],
    fields: [{ key: "userId", label: "User", type: "select", required: true, optionsResource: "users", optionLabel: "name" }, { key: "roleId", label: "Role", type: "select", required: true, optionsResource: "roles", optionLabel: "name" }],
  },
  {
    slug: "role_permission_mappings", title: "Role permissions", description: "Assign permissions to roles.", group: "Access control",
    columns: [{ key: "role.name", label: "Role" }, { key: "permission.module", label: "Module" }, { key: "permission.name", label: "Permission" }, { key: "createdAt", label: "Assigned" }],
    fields: [{ key: "roleId", label: "Role", type: "select", required: true, optionsResource: "roles", optionLabel: "name" }, { key: "permissionId", label: "Permission", type: "select", required: true, optionsResource: "permissions", optionLabel: "module" }],
  },
  {
    slug: "faculty_groups", title: "Faculty groups", description: "Groups used to organize task assignment and visibility.", group: "Access control",
    columns: [{ key: "name", label: "Group" }, { key: "createdAt", label: "Created" }], fields: [{ key: "name", label: "Group name", type: "text", required: true }],
  },
  {
    slug: "faculty_group_mappings", title: "Faculty group members", description: "Manage which users belong to each faculty group.", group: "Access control",
    columns: [{ key: "group.name", label: "Group" }, { key: "user.name", label: "User" }, { key: "isActive", label: "Active" }],
    fields: [{ key: "groupId", label: "Group", type: "select", required: true, optionsResource: "faculty_groups", optionLabel: "name" }, { key: "userId", label: "User", type: "select", required: true, optionsResource: "users", optionLabel: "name" }, { key: "isActive", label: "Active membership", type: "boolean" }],
  },
];

export const RESOURCE_MAP = Object.fromEntries(RESOURCE_CONFIGS.map((config) => [config.slug, config])) as Record<string, ResourceConfig>;
