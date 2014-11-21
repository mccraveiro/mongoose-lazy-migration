mongoose-lazy-migration
=======================

Based on: [kennethklee/mongoose-rolling-migration](https://github.com/kennethklee/mongoose-rolling-migration)

Mongoose Lazy Migration is a plugin to manage schema migrations. The advantage of mongodb is that you don't need to migrate all the data at once. Instead of doing so, this plugin execute migrations as you access data. So old untouched data won't be migrated until it is needed.

Warning: If you process large amounts of data at once, the migration may take some time. In this case, you may want to use a background process to migrate all data.


install
-------

1.  Install the plugin to your node app.

    `npm install -save mongoose-lazy-migration`

2.  Install mongoose lazy migration globally. (For command line)

    `npm install -g mongoose-lazy-migration`

3.  Install the migrate plugin on your schemas.

    ```
    var migrate = require('mongose-lazy-migration');

    var UserSchema = new mongoose.Schema({
        username: String,
        password: String
    });

    UserSchema.plugins(migrate);
    ```

    This plugin adds a new field, `__m`, to your schema to track the record's migration version.

4.  Initialize migration tracking in your code. In a CLI:

    `migrate init`

    This will create a `./migrations` directory and initialize it with a index.js file which holds the latest versions of migration. The plugin will use this to check for which records needs to be updated.


usage
-----

### Create a Migration

First, you need a migration script to update your models. To create one, use the `migrate create` command.

`migrate create <collection name> <title>`

Example:
`migrate create users "Add description"`

This will create migration script in `./migrations` with the filename `<collection name>-<version>-<title>`. For example, your first migration on the users collection will be `users-001-add-description.js`.

Important Note: collection name is case sensitive!

### Edit Migration File
Open up your migration file. It should have a default `up` and `down` function.

Example:
```
exports.up = function(data) {
    data.description = "This is the default description.";
    return data;
};

exports.down = function(data) {
    data['$unset'] = {
        description: ''
    };
    return data;
};
```

### Perform Migration

All migrations are executed as you access data (init hook). So you don't need to do anything to migrate your data.
