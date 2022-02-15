const fs = require("fs/promises");
const path = require("path");
const { v4 } = require("uuid");

const contactsPath = path.join(__dirname, "./contacts.json");

const listContacts = async() => {
    const data = await fs.readFile(contactsPath);
    const list = JSON.parse(data);
    return list;
}

const getContactById = async(id) => {
    const contacts = await listContacts();
    const ID = id.toString();
    const result = await contacts.find(contact => contact.id === ID);
    if(!result){
        return null;
    }
    return result;
}

const removeContact = async (id) => {
    const contacts = await listContacts();
    const ID = id.toString();
    const idx = contacts.findIndex(contact => contact.id === ID);
    if (idx === -1) {
        return null;
    }
    const deletedContact = contacts[idx];
    contacts.splice(idx, 1);
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return deletedContact;

}
const addContact = async(name, email, phone) => {
    const contact = { id: v4(), name, email, phone };
    const contacts = await listContacts();
    contacts.push(contact);
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return contact;

}

const updateContact = async (contactId, body) => {
    const contacts = await listContacts();
    const idx = contacts.findIndex(item => item.id === contactId);
    if(idx === -1){
        return null;
    }
    const id = contactId;
    const { name, email, phone } = body;
    contacts[idx] = {id, name, email, phone};
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
    return contacts[idx]
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
}
