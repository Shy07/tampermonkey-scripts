// ==UserScript==
// @name         NGA 图片浏览器
// @namespace    https://greasyfork.org/zh-CN/users/164691-shy07
// @version      1.40
// @description  收集指定楼层的图片，改善图片浏览体验，并支持批量下载
// @author       Shy07
// @match        *://nga.178.com/*
// @match        *://bbs.ngacn.cc/*
// @match        *://bbs.nga.cn/*
// @match        *://ngabbs.com/*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlHttpRequest
// jshint        esversion:6
// ==/UserScript==

((ui, self) => {
  'use strict'

  if (ui === undefined) return

  let imageSources = []
  let currentImage = 0

  const callerId = '_shy07_gallery_caller'
  const containerClass = '_shy07_gallery_container'
  const imgClass = '_shy07_gallery_img'
  const galleryContainerStyle = `
    display: block;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
  `
  const galleryImgStyle = `
    display: block;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    text-align: center;
    line-height: 100vh;
    color: #fff;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  `
  const arrowStyle = `
    display: block;
    position: fixed;
    top: 0;
    line-height: 100vh;
    color: #fff;
    font-size: 5rem;
    text-decoration-line: none;
  `
  const leftArrowStyle = `
    left: 0;
    padding-left: 1rem;
  `
  const rightArrowStyle = `
    right: 0;
    padding-right: 1rem;
  `
  const closeBtnStyle = `
    display: text-block;
    position: fixed;
    top: 0;
    right: 0;
    padding: 1rem 2rem;
    color: #fff;
    text-decoration-line: none;
  `
  const topLeftMenuStyle = `
    position: fixed;
    top: 0;
    left: 0;
    padding: 1rem 2rem;
  `
  const topLeftMenuItemStyle = `
    display: text-block;
    margin-right: 1rem;
    color: #fff;
    text-decoration-line: none;
  `

  const showCollapseContent = container => {
    const elements = container.querySelectorAll('.collapse_btn')
    if (elements && elements.length > 0) {
      elements.forEach(ele => {
        const btn = ele.querySelector('button')
        btn && btn.click()
      })
    }
  }

  const checkFileSize = (url, callback, tryTimes = 0) => {
    const GM_download = GM.xmlHttpRequest || GM_xmlHttpRequest
    const clearUrl = url.replace(/[&\?]?download_timestamp=\d+/, '')
    const retryUrl = clearUrl + (clearUrl.indexOf('?') === -1 ? '?' : '&') + 'download_timestamp=' + new Date().getTime()
    GM_download({
      method: 'HEAD',
      responseType: 'blob',
      url,
      onreadystatechange: (responseDetails) => {
        if (responseDetails.readyState === 4) {
          if (responseDetails.status === 200 || responseDetails.status === 304 || responseDetails.status === 0) {
            const match = responseDetails.responseHeaders
              .replace(/ /g, '')
              .match(/content-length:\d+/)
            const tmp = match && match[0] && match[0].split(':')
            const len = parseInt(tmp[1], 10)
            if (len && (len / 1024 >= 5)) {
              callback(len)
            } else if (tryTimes++ === 3) {
              callback(len)
            } else {
              checkFileSize(retryUrl, callback, tryTimes)
            }
          } else {
            if (tryTimes++ === 3) {
              callback(null)
            } else {
              checkFileSize(retryUrl, callback, tryTimes)
            }
          }
        }
      },
      onerror: (responseDetails) => {
        if (tryTimes++ === 3) {
          callback(null)
        } else {
          checkFileSize(retryUrl, callback, tryTimes)
        }
        console.log(responseDetails.status)
      }
    })
  }

  const setImageSrc = (src, ele = null) => {
    const img = ele || document.querySelector('.' + imgClass)
    if (!img) return
    checkFileSize(src, size => {
      img.innerHTML = ''
      img.style.backgroundImage = ''
      if (size > 102400) {
        img.style.backgroundImage = `url(${src})`
      } else {
        const tips = document.createElement('a')
        const showImage = () => {
          img.removeChild(tips)
          img.style.backgroundImage = `url(${src})`
        }
        tips.href = 'javascript:void(0)'
        tips.style = `
          color: #fff;
          text-decoration-line: none;
        `
        tips.innerHTML = '图片太小已隐藏，点此显示'
        tips.addEventListener('click', showImage)
        img.appendChild(tips)
      }
    })
  }
  const prevImage = () => {
    currentImage = currentImage === 0 ? imageSources.length - 1 : currentImage - 1
    setImageSrc(imageSources[currentImage])
  }
  const nextImage = () => {
    currentImage = currentImage === imageSources.length - 1 ? 0 : currentImage + 1
    setImageSrc(imageSources[currentImage])
  }
  const handleKeydown = ev => {
    const code = ev.keyCode
    if (code === 37) {
      prevImage()
      ev.preventDefault()
    } else if (code === 39) {
      nextImage()
      ev.preventDefault()
    }
  }

  const ajaxDownload = (url, callback, args, tryTimes = 0) => {
    const GM_download = GM.xmlHttpRequest || GM_xmlHttpRequest
    const clearUrl = url.replace(/[&\?]?download_timestamp=\d+/, '')
    const retryUrl = clearUrl + (clearUrl.indexOf('?') === -1 ? '?' : '&') + 'download_timestamp=' + new Date().getTime()
    GM_download({
      method: 'GET',
      responseType: 'blob',
      url: url,
      onreadystatechange: (responseDetails) => {
        if (responseDetails.readyState === 4) {
          if (responseDetails.status === 200 || responseDetails.status === 304 || responseDetails.status === 0) {
            const blob = responseDetails.response
            const size = blob && blob.size
            if (size && (size / 1024 >= 5)) {
              callback(blob, args)
            } else if (tryTimes++ === 3) {
              callback(blob, args)
            } else {
              ajaxDownload(retryUrl, callback, args, tryTimes)
            }
          } else {
            if (tryTimes++ === 3) {
              callback(null, args)
            } else {
              ajaxDownload(retryUrl, callback, args, tryTimes)
            }
          }
        }
      },
      onerror: (responseDetails) => {
        if (tryTimes++ === 3) {
          callback(null, args)
        } else {
          ajaxDownload(retryUrl, callback, args, tryTimes)
        }
        console.log(responseDetails.status)
      }
    })
  }

  const fileNameFromHeader = (disposition, url) => {
    if (disposition && /filename=.*/ig.test(disposition)) {
      const result = disposition.match(/filename=.*/ig)
      return decodeURI(result[0].split("=")[1])
    }
    return url.substring(url.lastIndexOf('/') + 1)
  }

  const downloadBlobFile = (content, fileName) => {
    if ('msSaveOrOpenBlob' in navigator) {
      navigator.msSaveOrOpenBlob(content, fileName)
    } else {
      const aLink = document.createElement('a')
      aLink.download = fileName
      aLink.style = 'display:none;'
      const blob = new Blob([content])
      aLink.href = window.URL.createObjectURL(blob)
      document.body.appendChild(aLink)
      if (document.all) {
        aLink.click() //IE
      } else {
        const evt = document.createEvent('MouseEvents')
        evt.initEvent('click', true, true)
        aLink.dispatchEvent(evt) // 其它浏览器
      }
      window.URL.revokeObjectURL(aLink.href)
      document.body.removeChild(aLink)
    }
  }

  const downloadUrlFile = (url, fileName) => {
    const aLink = document.createElement('a')
    if (fileName) {
      aLink.download = fileName
    } else {
      aLink.download = url.substring(url.lastIndexOf('/') + 1)
    }
    aLink.target = '_blank'
    aLink.style = 'display:none;'
    aLink.href = url
    document.body.appendChild(aLink)
    if (document.all) {
      aLink.click() //IE
    } else {
      const evt = document.createEvent('MouseEvents')
      evt.initEvent('click', true, true)
      aLink.dispatchEvent(evt) // 其它浏览器
    }
    document.body.removeChild(aLink)
  }

  const downloadImage = () => {
    const url = imageSources[currentImage]
    const filename = url.split('/').pop()
    ajaxDownload(url, downloadBlobFile, filename)
  }

  const downloadAllImage = (blob = null, { list, filename } = {}) => {
    if (blob && filename) downloadBlobFile(blob, filename)
    const [first, ...newList] = list || imageSources
    if (!first) return
    const f = first.split('/').pop()
    ajaxDownload(first, downloadAllImage, { list: newList, filename: f })
  }

  const openInNewTab = () => {
    window.open(imageSources[currentImage], '_blank')
  }

  const createGalleryImage = () => {
    currentImage = 0
    const img = document.createElement('div')
    img.className = imgClass
    img.style = galleryImgStyle
    setImageSrc(imageSources[0], img)
    return img
  }
  const createLeftArrow = () => {
    const ele = document.createElement('a')
    ele.style = arrowStyle + leftArrowStyle
    ele.innerHTML = '<'
    ele.href = 'javascript:void(0)'
    ele.addEventListener('click', prevImage)
    return ele
  }
  const createRightArrow = () => {
    const ele = document.createElement('a')
    ele.style = arrowStyle + rightArrowStyle
    ele.innerHTML = '>'
    ele.href = 'javascript:void(0)'
    ele.addEventListener('click', nextImage)
    return ele
  }
  const createCloseBtn = () => {
    const ele = document.createElement('a')
    ele.style = closeBtnStyle
    ele.innerHTML = '关闭'
    ele.href = 'javascript:void(0)'
    ele.addEventListener('click', hideGallery)
    return ele
  }
  const createTopLeftMenu = () => {
    const ele = document.createElement('div')
    ele.style = topLeftMenuStyle
    const downloadBtn = document.createElement('a')
    downloadBtn.style= topLeftMenuItemStyle
    downloadBtn.innerHTML = '下载'
    downloadBtn.href = 'javascript:void(0)'
    downloadBtn.addEventListener('click', downloadImage)
    const downloadAllBtn = document.createElement('a')
    downloadAllBtn.style= topLeftMenuItemStyle
    downloadAllBtn.innerHTML = '全部下载'
    downloadAllBtn.href = 'javascript:void(0)'
    downloadAllBtn.addEventListener('click', downloadAllImage)
    const newTabBtn = document.createElement('a')
    newTabBtn.style= topLeftMenuItemStyle
    newTabBtn.innerHTML = '新页面打开'
    newTabBtn.href = 'javascript:void(0)'
    newTabBtn.addEventListener('click', openInNewTab)
    ele.appendChild(downloadBtn)
    ele.appendChild(downloadAllBtn)
    ele.appendChild(newTabBtn)
    return ele
  }

  const showGallery = () => {
    if (!imageSources.length) {
      window.alert('这层楼没有图片 ￣□￣｜｜')
      return
    }
    document.addEventListener('keydown', handleKeydown)
    const galleryMask = document.querySelector('.' + containerClass)
    if (galleryMask) {
      currentImage = 0
      setImageSrc(imageSources[currentImage])
      galleryMask.style = galleryContainerStyle
    } else {
      const ele = document.createElement('div')
      ele.className = containerClass
      ele.style = galleryContainerStyle
      const img = createGalleryImage()
      const leftArrow = createLeftArrow()
      const rightArrow = createRightArrow()
      const closeBtn = createCloseBtn()
      const topLeftMenu = createTopLeftMenu()
      ele.appendChild(img)
      ele.appendChild(leftArrow)
      ele.appendChild(rightArrow)
      ele.appendChild(closeBtn)
      ele.appendChild(topLeftMenu)
      document.body.appendChild(ele)
    }
  }
  const hideGallery = () => {
    document.removeEventListener('keydown', handleKeydown)
    const galleryMask = document.querySelector('.' + containerClass)
    if (galleryMask) {
      galleryMask.style.display = 'none'
    }
  }

  const getExtname = url => {
    const filename = url.split('/').pop()
    const extname = filename.split('.').pop()
    return extname
  }
  const collectImages = container => {
    showCollapseContent(container)
    imageSources = []
    const imgs = container.querySelectorAll('img')
    const temp = []
    imgs.forEach(img => {
      const src = img.src
      const lazySrc = img.dataset ? img.dataset.srclazy : ''
      if (lazySrc) {
        imageSources.push(lazySrc)
        return
      }
      if (src.includes('/attachments/')) {
        const fileExtname = getExtname(img.src)
        const arr = img.src
          .replace(/https:/g, 'http:')
          .replace(/\.medium\./, '.')
          .replace(/\.thumb\./, '.')
          .replace(/\.thumb_s\./, '.')
          .replace(/\.thumb_ss\./, '.')
          .replace(`${fileExtname}.${fileExtname}`, fileExtname)
          .split('http:')
        const src = arr.filter(s => !!s)
        imageSources.push(src[0])
      }
    })
  }

  const callerButton = container => {
    const a = document.createElement('a')
    const handleClick = () => {
      collectImages(container.parentElement)
      showGallery()
    }
    a.addEventListener('click', handleClick)
    a.id = callerId + container.id
    a.className = 'small_colored_text_btn block_txt_c0 stxt'
    a.href = 'javascript:void(0)'
    a.title = '图片浏览'
    a.innerHTML = `
      <span>&nbsp;
        <span style="font-family: comm_glyphs; -webkit-font-smoothing: antialiased; line-height: 1em;">
          图集
        </span>&nbsp;
      </span>
    `
    return a
  }

  const createCallerButton = postData => {
    const checkExist = document.querySelector('#' + callerId + postData.i)
    if (!checkExist) {
      const container = postData.pInfoC
      container.appendChild(callerButton(container))
    }
  }

  if (ui.postArg) {
    Object.keys(ui.postArg.data).forEach(index => {
      const data = ui.postArg.data[index]
      createCallerButton(data)
    })
  }

})(commonui, __CURRENT_UID)
