require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Group = require('./models/Group');
const Contact = require('./models/Contact');
const Reminder = require('./models/Reminder');

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;

async function seed() {
  try {
    // Try register first, fall back to login
    let token;
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Demo User', email: 'demo@remindr.app', password: 'demo123456' }),
    });
    const regData = await regRes.json();

    if (regData.token) {
      token = regData.token;
      console.log('✅ User registered');
    } else {
      // User already exists, login
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@remindr.app', password: 'demo123456' }),
      });
      const loginData = await loginRes.json();
      token = loginData.token;
      console.log('✅ User logged in (already existed)');
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Create groups
    const groupDefs = [
      { name: 'Family', description: 'Immediate family members', color: '#6366f1' },
      { name: 'Friends', description: 'Close friends', color: '#22c55e' },
      { name: 'Coworkers', description: 'Work colleagues', color: '#f59e0b' },
      { name: 'Neighbors', description: 'People on the block', color: '#ec4899' },
    ];

    const groups = {};
    for (const g of groupDefs) {
      const res = await fetch(`${API_URL}/groups`, { method: 'POST', headers, body: JSON.stringify(g) });
      const data = await res.json();
      if (!data.data || !data.data._id) {
        console.error('Failed to create group:', g.name, data);
        continue;
      }
      groups[g.name] = data.data._id;
    }
    console.log(`✅ ${Object.keys(groups).length} groups created`);

    // Create 15 contacts
    const contactDefs = [
      { firstName: 'Robert', lastName: 'Johnson', phone: '+1 (555) 123-4567', email: 'robert.j@email.com', birthday: '1960-02-22', notes: 'Dad - loves fishing', groups: [groups.Family] },
      { firstName: 'Linda', lastName: 'Johnson', phone: '+1 (555) 234-5678', email: 'linda.j@email.com', birthday: '1962-07-14', notes: 'Mom', groups: [groups.Family] },
      { firstName: 'Sarah', lastName: 'Johnson', phone: '+1 (555) 345-6789', email: 'sarah.j@email.com', birthday: '1990-11-03', notes: 'Sister', groups: [groups.Family, groups.Friends] },
      { firstName: 'David', lastName: 'Johnson', phone: '+1 (555) 111-2222', email: 'david.j@email.com', birthday: '1995-03-28', notes: 'Brother', groups: [groups.Family] },
      { firstName: 'Mike', lastName: 'Chen', phone: '+1 (555) 456-7890', email: 'mike.chen@email.com', birthday: '1988-04-22', notes: 'Best friend from college', groups: [groups.Friends] },
      { firstName: 'Emma', lastName: 'Williams', phone: '+1 (555) 567-8901', email: 'emma.w@company.com', birthday: '1992-03-15', notes: 'Project manager', groups: [groups.Coworkers] },
      { firstName: 'James', lastName: 'Park', phone: '+1 (555) 678-9012', email: 'james.park@email.com', birthday: '1989-12-25', notes: 'College roommate', groups: [groups.Friends] },
      { firstName: 'Olivia', lastName: 'Martinez', phone: '+1 (555) 333-4444', email: 'olivia.m@email.com', birthday: '1991-05-10', notes: 'Yoga buddy', groups: [groups.Friends] },
      { firstName: 'Daniel', lastName: 'Lee', phone: '+1 (555) 444-5555', email: 'daniel.l@company.com', birthday: '1987-08-19', notes: 'Team lead', groups: [groups.Coworkers] },
      { firstName: 'Sophia', lastName: 'Brown', phone: '+1 (555) 555-6666', email: 'sophia.b@email.com', birthday: '1993-02-28', notes: 'Friend from gym', groups: [groups.Friends] },
      { firstName: 'Liam', lastName: 'Garcia', phone: '+1 (555) 666-7777', email: 'liam.g@email.com', birthday: '1985-06-30', notes: 'Neighbor - lives next door', groups: [groups.Neighbors] },
      { firstName: 'Ava', lastName: 'Wilson', phone: '+1 (555) 777-8888', email: 'ava.w@company.com', birthday: '1990-09-12', notes: 'Designer on the team', groups: [groups.Coworkers] },
      { firstName: 'Noah', lastName: 'Taylor', phone: '+1 (555) 888-9999', email: 'noah.t@email.com', birthday: '1994-01-05', notes: 'Neighbor across the street', groups: [groups.Neighbors, groups.Friends] },
      { firstName: 'Isabella', lastName: 'Thomas', phone: '+1 (555) 999-0000', email: 'isabella.t@company.com', birthday: '1991-10-31', notes: 'HR manager', groups: [groups.Coworkers] },
      { firstName: 'Ethan', lastName: 'Anderson', phone: '+1 (555) 100-2000', email: 'ethan.a@email.com', birthday: '1986-04-01', notes: 'Old college friend', groups: [groups.Friends] },
    ];

    const contactIds = {};
    for (const c of contactDefs) {
      const res = await fetch(`${API_URL}/contacts`, { method: 'POST', headers, body: JSON.stringify(c) });
      const data = await res.json();
      contactIds[`${c.firstName} ${c.lastName}`] = data.data._id;
    }
    console.log('✅ 15 contacts created');

    // Create reminders spread across the year with subjectContact
    const reminderDefs = [
      {
        title: "Dad's Birthday",
        message: "Hey {{firstName}}! Just a reminder that Dad's birthday is today (Feb 22). Don't forget to call him!",
        type: 'birthday', date: '2026-02-22', recurringYearly: true,
        groups: [groups.Family],
        subjectContact: contactIds['Robert Johnson'],
      },
      {
        title: "Sophia's Birthday",
        message: "Hey {{firstName}}! It's Sophia's birthday today (Feb 28). Send her a message!",
        type: 'birthday', date: '2026-02-28', recurringYearly: true,
        groups: [groups.Friends],
        subjectContact: contactIds['Sophia Brown'],
      },
      {
        title: "Emma's Birthday",
        message: "Hey {{firstName}}! Emma from work turns a year older today (Mar 15). Grab a card!",
        type: 'birthday', date: '2026-03-15', recurringYearly: true,
        groups: [groups.Coworkers],
        subjectContact: contactIds['Emma Williams'],
      },
      {
        title: "David's Birthday",
        message: "Hey {{firstName}}! It's David's birthday today (Mar 28). Call your brother!",
        type: 'birthday', date: '2026-03-28', recurringYearly: true,
        groups: [groups.Family],
        subjectContact: contactIds['David Johnson'],
      },
      {
        title: "Parents' Wedding Anniversary",
        message: "Hey {{firstName}}! Today is Mom and Dad's wedding anniversary. Let's plan something nice!",
        type: 'anniversary', date: '2026-03-15', recurringYearly: true,
        groups: [groups.Family],
      },
      {
        title: "Mike's Birthday",
        message: "Hey {{firstName}}! Mike's birthday is today (Apr 22). Let's throw a party!",
        type: 'birthday', date: '2026-04-22', recurringYearly: true,
        groups: [groups.Friends],
        subjectContact: contactIds['Mike Chen'],
      },
      {
        title: "Olivia's Birthday",
        message: "Hey {{firstName}}! Olivia turns a year older today (May 10)!",
        type: 'birthday', date: '2026-05-10', recurringYearly: true,
        groups: [groups.Friends],
        subjectContact: contactIds['Olivia Martinez'],
      },
      {
        title: "Liam's Birthday",
        message: "Hey {{firstName}}! Neighbor Liam's birthday is today (Jun 30). Drop off a cake!",
        type: 'birthday', date: '2026-06-30', recurringYearly: true,
        groups: [groups.Neighbors],
        subjectContact: contactIds['Liam Garcia'],
      },
      {
        title: "Mom's Birthday",
        message: "Hey {{firstName}}! Mom's birthday is today (Jul 14). Let's make it special!",
        type: 'birthday', date: '2026-07-14', recurringYearly: true,
        groups: [groups.Family],
        subjectContact: contactIds['Linda Johnson'],
      },
      {
        title: "Independence Day BBQ",
        message: "Hey {{firstName}}! Don't forget about the 4th of July BBQ at our place!",
        type: 'holiday', date: '2026-07-04', recurringYearly: true,
        groups: [groups.Family, groups.Friends, groups.Neighbors],
      },
      {
        title: "Daniel's Birthday",
        message: "Hey {{firstName}}! Daniel's birthday is today (Aug 19). Team lunch?",
        type: 'birthday', date: '2026-08-19', recurringYearly: true,
        groups: [groups.Coworkers],
        subjectContact: contactIds['Daniel Lee'],
      },
      {
        title: "Ava's Birthday",
        message: "Hey {{firstName}}! Ava's birthday is today (Sep 12)!",
        type: 'birthday', date: '2026-09-12', recurringYearly: true,
        groups: [groups.Coworkers],
        subjectContact: contactIds['Ava Wilson'],
      },
      {
        title: "Halloween Party",
        message: "Hey {{firstName}}! Halloween party tonight at 7pm. Costumes required! 🎃",
        type: 'holiday', date: '2026-10-31', recurringYearly: true,
        groups: [groups.Friends, groups.Neighbors],
      },
      {
        title: "Sarah's Birthday",
        message: "Hey {{firstName}}! It's Sarah's birthday today (Nov 3)! Send her love!",
        type: 'birthday', date: '2026-11-03', recurringYearly: true,
        groups: [groups.Family, groups.Friends],
        subjectContact: contactIds['Sarah Johnson'],
      },
      {
        title: "James' Birthday",
        message: "Hey {{firstName}}! It's James' birthday today (Dec 25). Christmas baby!",
        type: 'birthday', date: '2026-12-25', recurringYearly: true,
        groups: [groups.Friends],
        subjectContact: contactIds['James Park'],
      },
      {
        title: "Company Holiday Party",
        message: "Hey {{firstName}}! Company holiday party this Friday at 6pm. RSVP if you haven't!",
        type: 'holiday', date: '2026-12-18', recurringYearly: false,
        groups: [groups.Coworkers],
      },
      {
        title: "Monthly Game Night",
        message: "Hey {{firstName}}! Game night is tonight at 7pm. Bring snacks!",
        type: 'custom', date: '2026-02-20', recurringYearly: false,
        groups: [groups.Friends],
      },
    ];

    for (const r of reminderDefs) {
      await fetch(`${API_URL}/reminders`, { method: 'POST', headers, body: JSON.stringify(r) });
    }
    console.log('✅ 17 reminders created (spread across all months)');

    console.log('\n🎉 Seed complete!');
    console.log('Login: demo@remindr.app / demo123456');
    console.log('15 contacts, 4 groups, 17 reminders with birthday exclusions');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
