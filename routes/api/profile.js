const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require('express-validator');
const request = require("request");
const config = require("config");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");


// @route GET api/profile/me
// @desc  Get current user's profile
// @access Private
router.get("/me" , auth , async (req , res) => {
    try {
        
        const profile = await Profile.findOne({user : req.user.id }).populate('user' , ['name' , 'avatar']);
       // console.log(profile);
        if(!profile){
            return res.status(400).json({msg : "There is no profile for this user"})
        }
       return res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
        
    }
})

// @route POST api/profile
// @desc  Create or update user's profile
// @access Private

router.post('/' ,[auth , [
    check('status' , 'Status is required').notEmpty(),
    check('skills', 'Skills are required').notEmpty() 
]
] , async (req , res) => {
    const errors = validationResult(req);   

    if(!errors.isEmpty()){
        return res.status(400).json( {errors : errors.array()});
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook
      } = req.body;

      // Building Profile object

      const profileFields = {};

      profileFields.user = req.user.id;
      if(company)profileFields.company = company;
      if(website)profileFields.website = website;
      if(location)profileFields.location = location;
      if(bio)profileFields.bio = bio;
      if(status)profileFields.status = status;
      if(githubusername)profileFields.githubusername = githubusername;
      if(skills){
          profileFields.skills = skills.split(',').map(skill => skill.trim());
      }
     // console.log(profileFields.skills);

     profileFields.social = {}; //initialize social as new object

     if(youtube)profileFields.social.youtube = youtube;
     if(twitter)profileFields.social.twitter = twitter;
     if(instagram)profileFields.social.instagram = instagram;
     if(linkedin)profileFields.social.linkedin = linkedin;
     if(facebook)profileFields.social.facebook = facebook;

     try {
        //check for profile
        let profile = await Profile.findOne({user : req.user.id});

        if(profile){
            //profile already exists .So we update it
            // new :true is added so as to return new document to profile
            profile = await Profile.findOneAndUpdate(
                {user : req.user.id} ,
                 {$set : profileFields} ,
                 {new : true});

            return res.json(profile);

        }
        //Create a new profile
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);

         
     } catch (err) {
         console.log(err.message);
         res.status(500).send("Server Error");
         
     }
      

})

// @route GET api/profile
// @desc  Get all Profiles
// @access Public

router.get('/' , async (req , res) => {

    try {
        const profiles = await Profile.find().populate('user' ,['name' , 'avatar']);
        res.json(profiles);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }

})

// @route GET api/profile/user/:user_id
// @desc  Get Profile by user id 
// @access Public

router.get('/user/:user_id' , async (req , res) => {

    try {
        const profile = await Profile.findOne({user : req.params.user_id}).populate('user' ,['name' , 'avatar']);
        
        if(!profile){
            return res.status(400).json({msg : "Profile not found "});

        }

        res.json(profile);
        
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){// In case when user id is invalid then also we want to show the same message
            return res.status(400).json({msg : "Profile not found "});

        }
        res.status(500).send("Server Error");
    }

})


// @route GET api/profile
// @desc  Delete User , Profile and Posts
// @access Private

router.delete('/' , auth ,async (req , res) => {

    try {
        //delete posts
        await Post.deleteMany({user : req.user.id}); 

     //delete profile
    await Profile.findOneAndRemove({user : req.user.id});
    //delete user
    await User.findOneAndRemove({_id : req.user.id});

    res.json({msg : 'User deleted'});
   
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }

})

// @route PUT api/profile/experience
// @desc  Add Profile Experience
// @access Private

router.put('/experience' ,[auth , [
    check('title' , 'Title is required').notEmpty(),
    check('company' , 'Company is required').notEmpty(),
    check('from' , 'From date  is required').notEmpty()
]] , async (req , res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body; 

    const newExp = {
        title, // means same as title : title
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        
        const profile = await Profile.findOne({user : req.user.id});

        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
   
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
    
})

// @route DELETE api/profile/experience/:exp_id
// @desc  Delete Profile Experience
// @access Private

router.delete("/experience/:exp_id" , auth , async (req ,res) => {

    try {
        
        const profile = await Profile.findOne({user : req.user.id});

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex , 1);

        await profile.save();

        res.json(profile);
   
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// @route PUT api/profile/education
// @desc  Add Profile education
// @access Private

router.put('/education' ,[auth , [
    check('school' , 'School is required').notEmpty(),
    check('degree' , 'Degree is required').notEmpty(),
    check('fieldofstudy' , 'Field of Study is required').notEmpty(),
    check('from' , 'From date  is required').notEmpty()
]] , async (req , res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body; 

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        
        const profile = await Profile.findOne({user : req.user.id});

        profile.education.unshift(newEdu);

        await profile.save();

        res.json(profile);
   
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
    
})

// @route DELETE api/profile/education/:edu_id
// @desc  Delete Profile education
// @access Private

router.delete("/education/:edu_id" , auth , async (req ,res) => {

    try {
        
        const profile = await Profile.findOne({user : req.user.id});

        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex , 1);

        await profile.save();

        res.json(profile);
   
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
})

// // @route GET api/profile/github/:username
// // @desc  Get github repos
// // @access Public

// router.get("/github/:username" , async (req ,res) => {


//     try {
        
//         const options = {
//              uri : `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get("githubClientId")}&client_secret=${config.get("githubSecret")}`,
//              method : "GET",
//              headers: { 'user-agent': 'node.js' }
//         }
//    request(options , (error ,response , body) => {
//        if(error)console.error(error);

//        if(response.statusCode !== 200){
//            return res.status(404).json({msg : "No Github Profile found"});
//        }
//        res.json(JSON.parse(body));
//    })

//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send("Server Error");
//     }
// })


// @route       GET api/profile/github/:username
// @desc        Get user repos from Github
// @access      Public
router.get("/github/:username", async (req, res) => {
    try {
      const options = {
        uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get("githubClientId")}&client_secret=${config.get("githubSecret")}`,
        headers: { "user-agent": "node.js" },
      };
        
      const response = await axios.get(options.uri, { headers: options.headers });
  
      console.log(response.status);
      // if (response.status !== 200) {
      //   return res.status(404).json({ msg: "No github profile found" });
      // }
      return res.json(response.data);
    } catch (err) {
        console.log("shit")
      if (err.response.status === 404)
        return res.status(404).json({ msg: "No github profile found" });
     return res.status(500).json("Server Error");
    }
  });
  



module.exports = router ; 