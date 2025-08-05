{
  "tables": [
    {
      "name": "User",
      "columns": [
        { "name": "id", "type": "string", "primary": true },
        { "name": "email", "type": "string", "unique": true },
        { "name": "password", "type": "string" },
        { "name": "fullname", "type": "string" },
        { "name": "role", "type": "string", "default": "USER" },
        { "name": "createdAt", "type": "datetime", "default": "now()" },
        { "name": "updatedAt", "type": "datetime" }
      ]
    },
    ...
  ]
}