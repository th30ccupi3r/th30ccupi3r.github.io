---
title: "VulnOs: Hacking a Voice Mail with OSINT"
date: 2024-05-29 17:40:00 +0000
nick: t0
rank: ""
nick_color: "#b5b0cf"
---

We begin with a homepage for a software development company called Oxford Software International, clicking around we get some information on the “about” page about the Owner, including his name and when the company was founded. This is all great stuff to note down as it could give us insight on the types of passwords the user uses.

![about](/assets/images/vulnos/about.png)

If we download the profile image and drop it into an online EXIF reader, we can see the GPS locations where the image was taken:

![GPS](/assets/images/vulnos/gps-1.png)

Looking this up on Google Maps shows us the full address:

![GPS](/assets/images/vulnos/gps-2.png)

If we search for the company domain name “vulnos.co.uk” on Twitter we will find the following account:

![twitter](/assets/images/vulnos/twitter.png)

We also notice from Nikhil’s username that it appears to end with his birth year “1977”, we also note this down.

If we scroll through his tweets a little we can see a picture with a plane ticket for vulnair.co.uk

![ticket](/assets/images/vulnos/ticket.png)

If we crop the image and upload just the QR code to an online scanner like this we can see the following:

![QR](/assets/images/vulnos/qr.png)

The Vulnair site has a link to a /mybooking endpoint that asks for Booking Reference and Passenger Surname.

![booking ref](/assets/images/vulnos/bookingref.png)

Looking this up also gives us the user’s phone number:

![booking details](/assets/images/vulnos/booking-details.png)

Ok, we need to expand our attack surface as we have exhausted everything that we have so far, so I checked on the certificate transparency logs for additional subdomains. Remember vulnos.co.uk is the OSINT domain for the challenge, we need to add this subdomain to our assigned subdomain of ctfio.com to access it.

![CRT SH](/assets/images/vulnos/crt.sh.png)

Browsing to https://webmail-srv-01.$our-assigned-subdomain$.ctfio.com asks us to login, there is also a password reset page. Fortunately, it’s asking for information that we already have yay!

![webmail login](/assets/images/vulnos/webmaillogin.png)

When enter the email address of email: nikhil.singh@vulnos.co.uk this prompts us for a postcode and phone number which we already have :D

![Password Reset](/assets/images/vulnos/password-reset.png)

To view the message we click on the subject “Portal Access”:

![mailbox](/assets/images/vulnos/mailbox.png)

Nikhil received an email from support telling him they reset his password to the admin portal (wait, there’s an admin portal?!).

![email](/assets/images/vulnos/email.png)

I know there was some crazy “phone hacking” scandal a few years back in the UK. I briefly looked into it at the time and I remembered that it appeared that they were using built-in functionality a lot of UK mobile carriers implement. If the user is on a call, you can call their number to get through to their voicemail, you usually need to type in a special code to access to it, so I just googled it.

![Google](/assets/images/vulnos/google.png)

So I dialed Nikhil’s number and hit asterisk and I got an automated message that said “to access your voice mail please enter the 4-digit code”.

Well, we came across a couple of theses in our travels, his year of birth (1977) and the date the company was registered (1998). I punched in 1977 and BOOM!!! I can hear his voicemail message that says: “Hi Nikhil, I’m just calling with the password for the admin portal it’s y************e”

It’s pretty obvious here that I’ve overlooked the admin panel, so let’s pull out gobuster and do some active subdomain brute-forcing, this tells us that the admin subdomain exists:

![gobuster](/assets/images/vulnos/gobuster.png)

Nice, it wants us to login, we put in the username from the webmail (nikhil.s001) and the password from the voicemail

![Admin Portal](/assets/images/vulnos/admin-portal1.png)

This grants us access to the admin portal.

![Admin Portal](/assets/images/vulnos/admin-portal.png)

Game Over!

