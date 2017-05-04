# MusicU
MusicU Senior Project

## Deploying MusicU
1. Clone this repository and open the contents in a terminal
2. Navigate to the `\FinalBuild` directory
3. Make sure you have Firebase CLI tools installed: https://www.npmjs.com/package/firebase-tools
4. Run the following commands to deploy

    `firebase login`

If you are already logged in on a personal account, run: `firebase logout` then `firebase login` again

Otherwise you will be prompted to login from a web broswer: login with the proper MusicU credentials  
Email: musicusquad@gmail.com  
Password: ***************

After you succesfully login as musicusquad@gmail.com run:
    `firebase init`
This will start a series of prompts to initiate the project from your local machine
1. Select Hosting
2. Select MusicU (musicu-d4bc8) 
3. What file should be used for Database Rules? -> Hit Enter
4. What do you want to use as your public directory? -> Hit Enter
5. Configure as a single-page app (rewrite all urls to /index.html)? -> Enter (N-Key)

Now you can delpoy the site anytime with:  
    `firebase deploy`
