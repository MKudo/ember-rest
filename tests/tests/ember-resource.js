var server = null;

module("Ember.Resource", {
  setup: function() {
    server = sinon.fakeServer.create();
  },

  teardown: function() {
    server.restore();
  }
});

test("should be copyable", function() {
  var props = {id: 1, first_name: "Joe", last_name: "Blow"};

  var contact = Contact.create(props);
  var copy = contact.copy();

  equal(copy.get("id"),         contact.get("id"),         "id matches");
  equal(copy.get("first_name"), contact.get("first_name"), "first_name matches");
  equal(copy.get("last_name"),  contact.get("last_name"),  "last_name matches");
});

test("should serialize its properties to JSON", function() {
  var props = {id: 1, first_name: "Joe", last_name: "Blow"};

  var contact = Contact.create(props);
  var serialized  = contact.serialize();

  equal(serialized.contact.first_name, props.first_name, "first_name matches");
  equal(serialized.contact.last_name,  props.last_name,  "last_name matches");
});

test("should deserialize its properties to JSON", function() {
  var props = {id: 1, first_name: "Joe", last_name: "Blow"};

  var contact = Contact.create();
  contact.deserialize(props);

  equal(contact.get("id"),         props.id,         "id matches");
  equal(contact.get("first_name"), props.first_name, "first_name matches");
  equal(contact.get("last_name"),  props.last_name,  "last_name matches");
});

test("should duplicate properties from another resource", function() {
  var contact = Contact.create({id: 1, first_name: "Joe", last_name: "Blow"});
  var contact2 = Contact.create();
  contact2.duplicateProperties(contact);

  equal(contact2.get("first_name"), contact.get("first_name"), "first_name matches");
  equal(contact2.get("last_name"),  contact.get("last_name"),  "last_name matches");
});

test("should determine a resourceUrl based upon id", function() {
  var contact = Contact.create({id: 1});
  equal(contact._resourceUrl(), "/contacts/1");
});

test("should interpret whether resource is new based upon id", function() {
  var contact = Contact.create({id: 1});
  equal(contact.isNew(), false);

  var newContact = Contact.create();
  equal(newContact.isNew(), true);
});

test("using a custom id field, should interpret whether resource is new based upon id", function() {
  var MongoContact = Contact.extend({resourceIdField: '_id'});

  var contact = MongoContact.create({_id: 1});
  equal(contact.isNew(), false);
  equal(contact._resourceId(), 1);

  var newContact = MongoContact.create();
  equal(newContact.isNew(), true);
});

test("should find a resource via ajax", function() {
  server.respondWith("GET", "/contacts/1",
                     [200,
                      { "Content-Type": "application/json" },
                      '{ "id": 1, "first_name": "Joe", "last_name": "Blow" }']);

  var contact = Contact.create({id: 1});
  contact.findResource()
    .done(function() { ok(true,  "findResource() done"); })
    .fail(function() { ok(false, "findResource() fail"); });

  server.respond();

  equal(contact.get("fullName"), "Joe Blow", "resource deserialized");
});

test("should create a resource via ajax", function() {
  server.respondWith("POST", "/contacts",
                     [200,
                      { "Content-Type": "application/json" },
                      '{ "id": 1, "first_name": "Joe", "last_name": "Blow" }']);

  var contact = Contact.create({first_name: "Joe", last_name: "Blow"});
  contact.saveResource()
    .done(function() { ok(true,  "saveResource() done"); })
    .fail(function() { ok(false, "saveResource() fail"); });

  server.respond();

  equal(contact.get("id"),       1,          "resource created");
  equal(contact.get("fullName"), "Joe Blow", "resource deserialized");
});

test("should update a resource via ajax", function() {
  server.respondWith("PUT", "/contacts/1",
                     [200,
                      { "Content-Type": "application/json" },
                      '']);

  var contact = Contact.create({id: 1, first_name: "Joe", last_name: "Blow"});
  contact.saveResource()
    .done(function() { ok(true,  "saveResource() done"); })
    .fail(function() { ok(false, "saveResource() fail"); });

  server.respond();
});

test("should delete a resource via ajax", function() {
  server.respondWith("DELETE", "/contacts/1",
                     [200,
                      { "Content-Type": "application/json" },
                      '']);

  var contact = Contact.create({id: 1, first_name: "Joe", last_name: "Blow"});
  contact.destroyResource()
    .done(function() { ok(true,  "destroyResource() done"); })
    .fail(function() { ok(false, "destroyResource() fail"); });

  server.respond();
});

test("tree should be copyable", function() {
  var props1 = {id: 1, first_name: "Joe", last_name: "Blow"};
  var props2 = {id: 2, first_name: "Some", last_name: "One"};
  var groupProp = {id: 1, group_name: "Test"};

  var contact1 = Contact.create(props1);
  var contact2 = Contact.create(props2);
  var group = Group.create(groupProp);

  group.set('contacts', [contact1, contact2]);

  var copy = group.copy();

  equal(copy.get("id"),         group.get("id"),         "group id matches");
  equal(copy.get("group_name"), group.get("group_name"), "group_name matches");

  equal(copy.get("contacts")[0].get('id'),         contact1.get("id"),         "contact1 id matches");
  equal(copy.get("contacts")[0].get("first_name"), contact1.get("first_name"), "contact1 first_name matches");
  equal(copy.get("contacts")[0].get("last_name"),  contact1.get("last_name"),  "contact1 last_name matches");
  equal(copy.get("contacts")[1].get("id"),         contact2.get("id"),         "contact2 id matches");
  equal(copy.get("contacts")[1].get("first_name"), contact2.get("first_name"), "contact2 first_name matches");
  equal(copy.get("contacts")[1].get("last_name"),  contact2.get("last_name"),  "contact2 last_name matches");
});

test("tree should serialize its properties to JSON", function() {
  var props1 = {id: 1, first_name: "Joe", last_name: "Blow"};
  var props2 = {id: 2, first_name: "Some", last_name: "One"};
  var groupProp = {id: 1, group_name: "Test"};

  var contact1 = Contact.create(props1);
  var contact2 = Contact.create(props2);
  var group = Group.create(groupProp);

  group.set('contacts', [contact1, contact2]);

  var serialized = group.serialize();

  equal(serialized.group.group_name, groupProp.group_name, "group_name matches");
  equal(serialized.group.contacts[0].contact.first_name, props1.first_name, "contact1 first_name matches");
  equal(serialized.group.contacts[0].contact.last_name,  props1.last_name,  "contact1 last_name matches");
  equal(serialized.group.contacts[1].contact.first_name, props2.first_name, "contact2 first_name matches");
  equal(serialized.group.contacts[1].contact.last_name,  props2.last_name,  "contact2 last_name matches");
});

test("tree should serialize its properties to JAX-RS formed JSON", function() {
  var props1 = {id: 1, first_name: "Joe", last_name: "Blow"};
  var props2 = {id: 2, first_name: "Some", last_name: "One"};
  var groupProp = {id: 1, group_name: "Test"};

  var contact1 = Contact.create(props1);
  var contact2 = Contact.create(props2);
  var group = Group.create(groupProp);

  group.set('contacts', [contact1, contact2]);
  group.set('connectionType', 'JAX-RS');
  contact1.set('connectionType', 'JAX-RS');
  contact2.set('connectionType', 'JAX-RS');

  var serialized = group.serialize();

  equal(serialized.group_name, groupProp.group_name, "group_name matches");
  equal(serialized.contacts[0].first_name, props1.first_name, "contact1 first_name matches");
  equal(serialized.contacts[0].last_name,  props1.last_name,  "contact1 last_name matches");
  equal(serialized.contacts[1].first_name, props2.first_name, "contact2 first_name matches");
  equal(serialized.contacts[1].last_name,  props2.last_name,  "contact2 last_name matches");
});

test("tree should deserialize its properties to JSON", function() {
  var props = {id: 1, group_name: "Test", contacts: [{contact:{first_name: "Joe", last_name: "Blow"}}, {contact:{first_name: "Some", last_name: "One"}}]};
  var group = Group.create();

  group.deserialize(props);

  equal(group.get("id"),         props.id,         "group id matches");
  equal(group.get("group_name"), props.group_name, "group_name matches");

  equal(group.get("contacts")[0].get("first_name"), props.contacts[0].first_name, "contact1 first_name matches");
  equal(group.get("contacts")[0].get("last_name"),  props.contacts[0].last_name,  "contact1 last_name matches");
  equal(group.get("contacts")[1].get("first_name"), props.contacts[1].first_name, "contact2 first_name matches");
  equal(group.get("contacts")[1].get("last_name"),  props.contacts[1].last_name,  "contact2 last_name matches");
});

test("tree should deserialize its properties to JAX-RS formed JSON", function() {
  var props = {id: 1, group_name: "Test", contacts: [{first_name: "Joe", last_name: "Blow"}, {first_name: "Some", last_name: "One"}]};
  var group = Group.create();

  group.deserialize(props);

  equal(group.get("id"),         props.id,         "group id matches");
  equal(group.get("group_name"), props.group_name, "group_name matches");

  equal(group.get("contacts")[0].get("first_name"), props.contacts[0].first_name, "contact1 first_name matches");
  equal(group.get("contacts")[0].get("last_name"),  props.contacts[0].last_name,  "contact1 last_name matches");
  equal(group.get("contacts")[1].get("first_name"), props.contacts[1].first_name, "contact2 first_name matches");
  equal(group.get("contacts")[1].get("last_name"),  props.contacts[1].last_name,  "contact2 last_name matches");
});

