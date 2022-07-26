import request from '../../utils/requests'
import {
  getChannelsFromStorage,
  hasToken,
  saveChannelsToStorage,
} from '../../utils/storage'

// 獲取用戶頻道
export const getUserChannels = () => {
  return async (dispatch) => {
    if (hasToken()) {
      // 發送請求獲取用戶頻道
      const res = await request.get('user/channels')
      // 保存用戶頻道到Redux
      dispatch(saveUserChannels(res.data.data.channels))
    } else {
      if (getChannelsFromStorage()) {
        const channels = getChannelsFromStorage()
        // 保存用戶頻道到Redux
        dispatch(saveUserChannels(channels))
      } else {
        // 既沒有登錄，也沒有本地緩存頻道。就需要發送請求去拿頻道
        const res = await request.get('user/channels')
        // 保存用戶頻道到Redux
        dispatch(saveUserChannels(res.data.data.channels))
        // 把頻道保存到本地
        saveChannelsToStorage(res.data.data.channels)
      }
    }
  }
}

// 保存用戶頻道到Redux
export const saveUserChannels = (payload) => {
  return {
    type: 'home/saveUserChannels',
    payload,
  }
}

// 獲取所有頻道
export const getAllChannels = () => {
  return async (dispatch) => {
    const res = await request.get('channels')
    dispatch(saveAllChannels(res.data.data.channels))
  }
}

// 把獲取到的所有頻道，存入到Redux
export const saveAllChannels = (payload) => {
  return {
    type: 'home/saveAllChannels',
    payload,
  }
}

// 從‘我的頻道’中點擊刪除一個頻道
export const delChannel = (channel) => {
  return async (dispatch, getState) => {
    // 獲取到所有的userChannels
    const { userChannels } = getState().home

    if (hasToken()) {
      //  如果登錄了，發送請求獲取頻道信息
      await request.delete('user/channels/' + channel)
    } else {
      // 如果沒有登錄，修改本地存儲數據
      saveChannelsToStorage(userChannels.filter((item) => item.id !== channel))
    }
    // 把獲取到的所有頻道，存入到Redux
    dispatch(
      saveUserChannels(userChannels.filter((item) => item.id !== channel))
    )
  }
}

// 從‘推薦頻道’中點擊添加一個頻道
export const addRecChannel = (channel) => {
  return async (dispatch, getState) => {
    const { userChannels } = getState().home

    if (hasToken()) {
      // 如果有登錄，就發送請求添加頻道

      await request.patch('user/channels', { channels: [channel] })
    } else {
      saveChannelsToStorage([...userChannels, channel])
    }
    // 把接收到的channel，加入到redux中的userChannels
    dispatch(saveUserChannels([...userChannels, channel]))
  }
}

// 發送請求，获取文章列表数据
export const getAtcList = (id, timestamp) => {
  return async (dispatch) => {
    const res = await request({
      url: 'articles',
      method: 'GET',
      params: {
        channel_id: id,
        timestamp,
      },
    })

    dispatch(
      setAtcList({
        id,
        timestamp: res.data.data.pre_timestamp,
        list: res.data.data.results,
      })
    )
  }
}

// 把文章列表數據存入redux
export const setAtcList = (payload) => {
  return {
    type: 'home/setAtcList',
    payload,
  }
}

// 發請求，獲得更多文章
export const loadMoreArticles = (id, timestamp) => {
  return async (dispatch) => {
    const res = await request({
      url: 'articles',
      method: 'GET',
      params: {
        channel_id: id,
        timestamp,
      },
    })
    console.log(res.data.data, 'res')
    dispatch(
      setMoreArticles({
        id,
        timestamp: res.data.data.pre_timestamp,
        list: res.data.data.results,
      })
    )
  }
}

// 把更多文章數據存入redux
export const setMoreArticles = (payload) => {
  return {
    type: 'home/setMoreArticles',
    payload,
  }
}

// 點擊差號時獲得的文章id存起來
export const setMoreAction = (payload) => {
  return {
    type: 'home/setMoreAction',
    payload,
  }
}

// 發請求，刪除不感興趣的文章
export const unLikeArticles = (articleId) => {
  return async (dispatch, getState) => {
    await request({
      url: 'article/dislikes',
      method: 'post',
      data: {
        target: articleId,
      },
    })

    const channelId = getState().home.moreAction.channelId

    const articles = getState().home.articleList[channelId]
    const timestamp = getState().home.articleList[channelId].timestamp

    dispatch(
      setAtcList({
        id: channelId,
        timestamp,
        list: articles.list.filter((item) => item.art_id !== articleId),
      })
    )
  }
}
