// ==UserScript==
// @name         NGA 版头/版规/置顶部分折叠
// @namespace    https://greasyfork.org/zh-CN/users/164691-shy07
// @version      0.12
// @description  自动折叠 NGA 版头/版规/置顶部分，需要的时候可以点击版头按钮显示（替换跳转功能）
// @author       Shy07
// @match        *://nga.178.com/*
// @match        *://bbs.ngacn.cc/*
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @grant        none
// jshint esversion:6
// ==/UserScript==

((n, self) => {
  'use strict'

  if (n === undefined) return

  const targetNode = document.querySelector('body')
  const config = {
    childList: true
  }
  let manualOpen = false

  const toggle = () => {
    const toppedTopic = document.querySelector('#toppedtopic')
    if (!toppedTopic) return
    toppedTopic.style.display = manualOpen ? 'none' : 'block'
    manualOpen = !manualOpen
  }
  const hookClickEvent = () => {
    const el = document.querySelector('#toptopics a[class="block_txt block_txt_c0"]')
    el.href = 'javascript:;'
    el.addEventListener('click', toggle)
  }

  const hideToppedTopic = () => {
    const toppedTopic = document.querySelector('#toppedtopic')
    if (!manualOpen && toppedTopic) {
      toppedTopic.style.display = 'none'
    }
  }
  hideToppedTopic()

  const observer = new MutationObserver((mutationsList, observer) => {
    hideToppedTopic()
    hookClickEvent()
  })
  observer.observe(targetNode, config)

})(commonui, __CURRENT_UID)
