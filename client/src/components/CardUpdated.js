import React, { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import GroupsIcon from '@mui/icons-material/Groups';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CallIcon from '@mui/icons-material/Call';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Dialog, DialogTitle, DialogContent, Snackbar, Slide, Grid, Container, Divider, Avatar } from '@mui/material';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { UserContext } from './userContext'
import CardActions from '@mui/material/CardActions';
import { green, red, orange, pink, purple } from '@mui/material/colors';
import { formatDistanceToNow } from 'date-fns';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
const getAvatarColor = (char) => {
  const colorMap = {
    R: green[500],
    S: red[500],
    P: orange[500],
    D: pink[500],
    T: purple[500],
    // Add more mappings as needed
  };
  return colorMap[char.toUpperCase()] || 'default';
};

const TrashCard = ({
  userName,
  card,
  userId,
  workTitle,
  salary,
  numOfWorkers,
  workingHours,
  majorCity,
  pincode,
  phoneNumber,
  isFavorite,
  location,
  description,
  showFullDescription,
  handleFavoriteClick,
  handleClick,
  duratoionOfWork,
  createdAt,

}) => {
  const { userInfo } = React.useContext(UserContext)
  const isLoggedIn = userInfo?.userName;
  const cardId = card._id
  // console.log(card);
  const [upvotes, setUpVotescount] = useState(0);
  const [downvotes, setDownVotescount] = useState(0);
  useEffect(() => {
    fetch(`http://127.0.0.1:4000/upvoteAndDownvote/${cardId}`)
      .then(res => {
        res.json().then(data => {
          setUpVotescount(data.upvotes);
          setDownVotescount(data.downvotes)
        })
      })
  }, [])

  const handleUpvote = () => {
    if (typeof userId !== 'undefined') {
      fetch('http://127.0.0.1:4000/updateUpvote',
        {
          method: 'PUT',
          body: JSON.stringify({ cardId, userId }),
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
        .then(response => {
          if (response.ok) {
            response.json().then(data => {
              setUpVotescount(data.upvotes);
              setDownVotescount(data.downvotes);
            });
          }
        });
    }
  }
  const handleDownvote = () => {
    console.log(userId)
    console.log(typeof userId)
    if (typeof userId !== 'undefined') {
      fetch('http://127.0.0.1:4000/updateDownvote',
        {
          method: 'PUT',
          body: JSON.stringify({ cardId, userId }),
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
        .then(response => {
          if (response.ok) {
            response.json().then(data => {
              setUpVotescount(data.upvotes);
              setDownVotescount(data.downvotes);
            });
          }
        });
    }
  }

  console.log("Username from card", userName);
  return (
    <>
      <Card
        elevation={5}
        sx={{
          maxWidth: 345,
          border: '1px grey',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          transition: 'box-shadow,scale 0.3s, background-color 0.3s',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
            scale: '1.01',
          },
        }}
      >
        <CardHeader
          title={(workTitle || 'WORK POSITION')}
          sx={{
            backgroundColor: '#67849D',
            '& .MuiTypography-root': {
              color: '#FFFFFF',
              textTransform: 'uppercase',
            },
          }}
          // subheader="day"
          action={
            <div>
              <IconButton aria-label="favorites" onClick={handleFavoriteClick}>
                <StarIcon sx={{ color: isLoggedIn ? (isFavorite ? '#FF4500' : '#ffffff') : '#ffffff', scale: '1.05' }} />
              </IconButton>
            </div>
          }
        />
        <Divider sx={{ backgroundColor: '#E0E0E0', height: '1px' }} />
        <CardContent sx={{ textAlign: 'left', marginBottom: '0px', paddingBottom: '0px' }}>
          <Typography paragraph sx={{}}>
            {[
              { label: 'Salary', icon: <CurrencyRupeeIcon style={{ color: '#f7980a' }} />, value: salary || 0 },
              { label: 'People', icon: <GroupsIcon style={{ color: 'blue' }} />, value: numOfWorkers || 0 },
              { label: 'Hours', icon: <ScheduleIcon style={{ color: 'black' }} />, value: workingHours || 0 },
              { label: 'Location', icon: <LocationOnIcon style={{ color: 'red' }} />, value: location || 'location' },
              { label: 'Contact info', icon: <CallIcon style={{ color: 'green' }}/>, value: phoneNumber || '9999999999' },
            ].map((item, index) => (
              <React.Fragment key={index}>
                <IconButton aria-label={item.label} sx={{ pointerEvents: 'none' }}>
                  {item.icon}
                </IconButton>
                {`${item.label}: ${item.value}`}
                <br />
              </React.Fragment>
            ))}
            {showFullDescription && <Divider sx={{ margin: '10px 0' }} />}
          </Typography>
        </CardContent>
        <CardActions sx={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '18px' }}>
          <div>
            <Button size="small" onClick={handleUpvote} sx={{ borderRadius: '18px', }}>
              <ThumbUpIcon sx={{ paddingRight: '5px' }} /> {upvotes}
            </Button>
            <Button size="small" onClick={handleDownvote} sx={{ borderRadius: '18px', }}>
              <ThumbDownIcon sx={{ paddingRight: '5px' }} /> {downvotes}
            </Button>
          </div>
          <Button size="small" onClick={handleClick} variant="outlined" sx={{ borderRadius: '18px' }}>
            Show More
          </Button>
        </CardActions>
        <Dialog open={showFullDescription} onClose={() => handleClick()} TransitionComponent={Slide} // Use Slide transition
          transitionDuration={500} minWidth="md" sx={{
            '& .MuiDialog-paper': {
              minWidth: '40%',
            },
          }}>
          <Typography sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', bgcolor: '#F0F0F0', }}><Avatar alt={userName} src="/static/images/avatar/2.jpg" sx={{ bgcolor: getAvatarColor(userName[0]), m: '8px' }}>
            {userName[0].toUpperCase()}
          </Avatar>
            {userName.charAt(0).toUpperCase() + userName.slice(1)}</Typography>
          <DialogTitle variant='h5' sx={{ textAlign: 'center', textDecoration: 'underline', bgcolor: '#F0F0F0', p: 2 }}> {workTitle}</DialogTitle>
          <DialogContent sx={{ textAlign: 'left' }}>
            <Typography color="text.secondary" sx={{ color: '#000000', marginTop: '10px', marginBottom: '10px' }}>
              <Typography color="text.secondary" sx={{ color: '#000000', marginTop: '10px', marginBottom: '10px', textDecoration: 'underline', }}>
                WorkDetails:
              </Typography>
              Salary per Month                    : <strong>{salary}</strong><br />
              Num of people required for this work: {numOfWorkers}<br />
              Working Hours per day               : {workingHours}<br />
              Location of Work                    : {location} <br />
              Major city                          : {majorCity}<br />
              Pincode                             : {pincode}<br />
              Num of months work provided         : {duratoionOfWork}<br />
              Contact                             : {phoneNumber}<br />
              Posted {formatDistanceToNow(new Date(createdAt))} ago <br />

              <br />
              Additional Info : {description}
            </Typography>
            <Button style={{ top: 0 }} onClick={() => handleClick()}>Close</Button>
          </DialogContent>
        </Dialog>
      </Card>
    </>
  );

};
const Trash4 = ({ cardData }) => {
  console.log(cardData);
  const { userInfo } = React.useContext(UserContext)
  const isLoggedIn = userInfo?.userName;
  const [cardStates, setCardStates] = useState(
    cardData.map(() => ({ isFavorite: false }))
  );
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    Transition: Slide,
    message: '',
  });

  const handleFavoriteClick = (card, index) => {
    setCardStates((prevStates) => {
      const newStates = [...prevStates];
      newStates[index].isFavorite = !newStates[index].isFavorite;

      // console.log(`before fun ${card}`)
      if (newStates[index].isFavorite) {
        setSnackbarState({
          open: true,
          Transition: Slide,
          message: isLoggedIn ? "Successfully added to favorites!" : "Please log in, to add to favorites"
        });
      }
      const id = card._id;
      const userId = userInfo?.id;
      if (newStates[index].isFavorite) {
        fetch('http://127.0.0.1:4000/postBookmark',
          {
            method: 'POST',
            body: JSON.stringify({ id, userId }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
      }
      else {
        fetch('http://127.0.0.1:4000/removeBookmark',
          {
            method: 'PUT',
            body: JSON.stringify({ id, userId }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          })
      }
      return newStates;
    });
  };


  const handleCloseSnackbar = () => {
    setSnackbarState({
      ...snackbarState,
      open: false,
    });
  };

  const handleClick = (index) => {
    setCardStates((prevStates) => {
      const newStates = [...prevStates];
      newStates[index].showFullDescription = !newStates[index].showFullDescription;
      return newStates;
    });
  };


  return (
    <Container sx={{
      padding: '20px 0',
      justifyContent: 'space-around',
      position: 'relative',
      height: '100%',
    }}>

      <Grid container spacing={3} sx={{ p: 3 }}>
        {cardData.map((card, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <TrashCard
              key={index}
              card={card}
              userId={userInfo?.id}
              userName={card.author.userName}
              workTitle={card.workTitle.toUpperCase()}
              salary={card.salary}
              type={card.type}
              numOfWorkers={card.numOfWorkers}
              workingHours={card.workingHours}
              location={card.location}
              majorCity={card.majorCity}
              pincode={card.pincode}
              phoneNumber={card.phoneNumber}
              duratoionOfWork={card.duratoionOfWork}
              createdAt={card.createdAt}
              description={card.description}
              // upvotes={upvotescount}
              // downvotes={downvotescount}
              isFavorite={cardStates[index].isFavorite}
              showFullDescription={cardStates[index].showFullDescription}
              handleFavoriteClick={() => handleFavoriteClick(card, index)}
              handleClick={() => { handleClick(index) }}
            // handleUpvote={() => handleUpvote(card)}
            // handleDownvote={() => handleDownvote(card)}
            />
          </Grid>
        ))}
      </Grid>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarState.open}
        onClose={handleCloseSnackbar}
        TransitionComponent={snackbarState.Transition}
        message={
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', }}>
            <CheckCircleIcon sx={{ marginRight: '5px', }} />
            <span style={{ marginTop: '4px' }} >{snackbarState.message}</span>
          </div>
        }
        autoHideDuration={1000}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: isLoggedIn ? '#4ea832' : '#FFFFFF',
            color: isLoggedIn ? '#FFFFFF' : '#000000',
          },
        }}
      />
    </Container>
  );
};
export default Trash4;
