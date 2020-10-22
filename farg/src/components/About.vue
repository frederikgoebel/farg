<template>
<div class="item-100 container about center">
  <div class="item-50 pl-64 pe-64 pt-64 pb-64">
    <div class="container center">
      <img class="logo" src="../assets/farg_logo.png">
      <h1 class="page-title">FÄRG</h1>
    </div>
    <p>
      Färg is an interactive installation that was created as part of the Interaction Design program at the Chalmers University of Technology in the autumn of 2020. The installation is part of an larger exhibition with the theme Quantified Self
      exhibited in the <a href="#">Visual Arena</a> in Gothenburg, Sweden. The exhibition is aimed at 12-16 year olds, and has the goal to raise the interest in science and technology, while at the same time providing a fun and inspiring experience.</p>
    <p>
      All the colors that can be seen on the feed are sampled from visitors at the Visual Arena. Färg samples the users colors on different points on the body and finds the most representative color for that area. Through this a unique color swatch
      is generated.
    </p>
    <p>
      The exhibtion takes place virtual and phyical on Friday the 23rd of October 2020. Register <strong><a target="_blank" href="https://attendee.gotowebinar.com/register/5463457196058028560">here</a></strong> to join.
    </p>
    <div class="container center createdContainer pt-32">
      <div class="item-100 pb-16">
        Created by:
      </div>
      <a class="pr-32">Tuyen Ngo
      </a>
      <a class="pr-32">Patricia Zabecka
      </a>
      <a class="pr-32">Hugo Eklund</a>
      <a>Frederik Göbel
      </a>
    </div>
    <div class="container center createdContainer pt-32 ">
      <a href="mailto:gobelf@student.chalmers.se" class="pr-32">
        <img class="mail-icon" src="../assets/icons/mail.png" alt="Mail icon" />
      </a>
      <a target="_blank" href="https://github.com/frederikgoebel/farg">
        <img class="mail-icon" src="../assets/icons/GitHub-Mark-Light-64px.png" alt="Mail icon" />
      </a>
    </div>
  </div>
  <!-- <div class="item-50 pl-64 pe-64 pt-64 pb-64 center container">

  </div> -->
</div>
</template>


<script>
export default {
  components: {},
}
</script>

<style scoped>
.about {
  font-size: 1.2rem;
  flex-grow: 1;
  flex-shrink: 0;
}

@media (max-width:1000px) {
  .item-50 {
    width: 90%;
  }
}

.mail-icon {
  width: 32px;
}

a {
  text-decoration: underline;
}

.createdContainer {
  text-align: center;
  font-size: 0.9rem;
}

.createdContainer a {
  text-decoration: none;
}

.page-title {
  font-size: 4rem;
  letter-spacing: 0.5rem;
}

.logo {
  height: 4rem;
  margin-right: 32px;
}

.center {
  justify-content: center;
  align-items: center;
  align-content: center;
}
</style>
