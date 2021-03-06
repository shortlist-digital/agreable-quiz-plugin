var Backbone = require('backbone')
var $ = require('jquery')
Backbone.$ = $

class Quiz extends Backbone.View {

  constructor (options) {

    console.log('Quiz::constructor')
    this.setElement(options.el)
    this.$el = $(options.el)

    this.quizType = this.$el.data('quiz-type');
    this.quizLength = this.$('.js-quiz-question').length;
    this.$progressItems = this.$('.js-quiz-progress-counter li')
    this.scrollTimer = new Date()
    this.shareText = "";

    // Backbone view events
    this.events = {
      'click .js-quiz-answer'               : 'onAnswerSelect',
      'click .js-quiz-progress-counter li'  : 'moveToQuestion'
    };

    this.render()
    super()

    $(window).scroll($.proxy(this.checkScroll, this))
  }

  moveToQuestion(e) {
    var $target = $(e.currentTarget);
    var questionNaturalIndex = parseInt($target.data('number'), 10) - 1
    var oldScrollTop = $(window).scrollTop()
    var $question = $("ul[data-question-index='question-" + questionNaturalIndex + "']")
    var newScrollTop = $question.offset().top + ($question.height() /2) - ($(window).height() /2)
    var distance = newScrollTop - oldScrollTop
    var speed = distance / 2
    if (speed < 0) {
      speed = speed * -1
    }

    $('html, body').animate({ scrollTop: newScrollTop } , speed)
  }

  updateQuiz(){
    var numberAnswered = this.$('.js-quiz-answer.is-selected').length

    if (numberAnswered >= this.quizLength) {
      var score = this.$el.find('.is-selected[data-cor]').length
      this.endQuiz(score)
    } else {
      var message = numberAnswered + ' of ' + this.quizLength + ' answered'

      this.$('.js-quiz-progress-text').html(message)
    }
  }

  updateProgressBarItem(index, el) {
    var $parent = $(el).parents('ul')
    var answeredQuestionIndex = $parent.data('question-index').replace('question-', '')
    var $item = this.$progressItems.eq(answeredQuestionIndex)
    $item.addClass('is-answered')
    if ($parent.find('.is-selected[data-cor]').length) {
      $item.addClass('is-correct')
    } else {
      $item.addClass('is-incorrect')
    }
  }

  updateProgressBar() {
    this.$progressItems
        .removeClass('is-answered')
        .removeClass('is-correct')
        .removeClass('is-incorrect')

    this.$('.is-selected').each($.proxy(this.updateProgressBarItem, this))
  }

  endQuiz(score) {
    this.$el.addClass('is-complete')

    // move to finish
    $(window).scrollTop(this.$('.js-quiz-progress-panel').position().top - (($(window).height() /2) -100))

    $('.js-quiz-progress-text').html('You\'re done!')

    if (this.quizType === 'score') {
      this.showScore(score)
    } else {
      this.showTextOutcome(this.getTextOutcome())
    }

  }

  checkScroll() {
    var newTimer = new Date()
    if ((newTimer.getTime() - 50) <= this.scrollTimer.getTime()) {
      return
    }
    this.scrollTimer = newTimer
    this.positionProgressBar()
    // checkPageViews()
  }

  positionProgressBar() {

    var scrollPos = $(window).scrollTop() + $(window).height()-100;
    if(scrollPos > $('.js-quiz-progress-anchor').offset().top ||
        scrollPos < $('.js-quiz-question:first-child').offset().top ) {
      $('.js-quiz-progress-counter').removeClass('is-fixed')
    } else {
      $('.js-quiz-progress-counter').addClass('is-fixed')
    }
  }

  onAnswerSelect(e) {
    var $target = $(e.currentTarget);
    $target.parents('ul').find('.js-quiz-answer').removeClass('is-selected')
    $target.addClass('is-selected')
    $target.parents('.js-quiz-question').addClass('is-answered')

    this.render()
  }

  getTextOutcome() {
    var mostPopularOutcome = {index: 1, score: 0}

    textOutcomes.forEach($.proxy(function(outcome, index){
        var score = this.$el.find('.js-quiz-question .is-selected[data-outcome-' + (index+1) + ']').length
        if (score > mostPopularOutcome.score) {
          mostPopularOutcome.index = index+1
          mostPopularOutcome.score = outcome.score = score
        }
    }, this))

    return textOutcomes[mostPopularOutcome.index -1]
  }

  showTextOutcome(outcome) {
    $('.js-quiz-score-message').html(outcome.label)
    $('.js-quiz-score-summary').html(outcome.description)
    $('.js-quiz-outcome-image').attr('src', outcome.image).fadeIn()
    $('.js-sharing-outcome').html(`My result <span class="is-bold">${outcome.label}</span>`)
    this.shareText = $('.js-sharing-quote').text();
    this.showMore(1000)
  }

  showScore(score) {

    var numQuestions = this.quizLength
    this.$('.js-quiz-score').html(score)
    this.$el.find('.js-quiz-total').html(numQuestions)
    $('.js-sharing-outcome').html(`My score was <span class="is-bold">${score}  out of ${numQuestions}</span>`)


    var scoreProportion = score/numQuestions
    var message
    if (scoreProportion <= 0.4) {
      message = $('#quiz-message-bad').html()
    } else if (scoreProportion <= 0.65) {
      message = $('#quiz-message-okay').html()
    } else if (scoreProportion <= 0.85) {
      message = $('#quiz-message-good').html()
    } else {
      message = $('#quiz-message-excellent').html()
    }

    $('.js-quiz-score-summary').html(message)

    /* Slowly reveal answers */
    var revealAnswerDuration = 200
    var revealOffest = 500
    var i = 1
    setTimeout(function() {
      $('.js-quiz-progress-counter li').each(function(index, el) {
        var $item = $(el)
        setTimeout(function() {
          $item.addClass('is-complete')
        }, i++ * revealAnswerDuration)
      })
    }, revealOffest)

    var timeTakenToRevealAnswers = revealOffest + (revealAnswerDuration * (numQuestions + 1))

    $('.js-outcome-replace').html('I scored <span class="is-bold">'+score+' out of '+ numQuestions+'</span>')
    this.shareText = $('.js-sharing-quote').text();

    this.showMore()
  }

  showMore(timeTakenToRevealAnswers=1000){

    /* Show answer information */
    $('.js-quiz-answer-info').addClass('is-revealed')

    /* Show result */
    setTimeout(function() {
     $('.js-quiz-score-message').addClass('is-revealed')
    }, timeTakenToRevealAnswers)

    /* Show sarcastic message */
    setTimeout(function() {
      this.$('.js-quiz-score-summary').addClass('is-revealed')
    }, timeTakenToRevealAnswers + 1000)

    /* Show sharing */
    setTimeout(function() {
      $('.js-sharing').addClass('show-wrapper').removeClass('hide-wrapper')
    }, timeTakenToRevealAnswers + 1000)

  }

  render() {
    this.updateQuiz()
    this.updateProgressBar()
    $('.js-share-facebook').on('click', $.proxy(this.shareFB, this));
    $('.js-share-twitter').on('click', $.proxy(this.shareTwitter, this));
    $('.js-share-google').on('click', $.proxy(this.shareGoogle, this));
  }

  shareGoogle(){
    var url = 'https://plus.google.com/share?url=' + window.location.href
    window.open(url,'','height=500,width=800');
  }

  shareTwitter(){
    var twitterHandle = '@ShortList';
    if (window.location.host == "www.stylist.co.uk") {
      twitterHandle = "@StylistMagazine"
    } else if (window.location.host == "www.emeraldstreet.com") {
      twitterHandle = "@EmeraldStreet"
    } else if (window.location.host == "www.mrhyde.com") {
      twitterHandle = "@Mr_Hyde"
    }

    var href = window.location.href
    var shareText = encodeURIComponent(this.shareText + ' ' + twitterHandle)

    var url = "https://twitter.com/intent/tweet?text="+shareText+"&url="+href;
    window.open(url,'','height=300,width=600');
  }

  shareFB(){
    if(!FB){
      return;
    }

    FB.ui({
      method: 'feed',
      link: window.location.href,
      name: this.shareText,
      description: 'Test yourself on ' + window.location.hostname,
      show_error: true,
      redirect_uri: window.location.href
    }, function(response){});
  }

}

var modules = $('.js-plugin-module[data-module="Quiz"]')
modules.each((index, el) => {
  new Quiz({el:el})
})

