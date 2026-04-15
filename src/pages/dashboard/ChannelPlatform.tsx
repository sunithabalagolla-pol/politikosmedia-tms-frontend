import { useSearchParams } from 'react-router-dom'
import ChannelsListView from '../../components/channels/ChannelsListView'
import ChannelSubcategoriesView from '../../components/channels/ChannelSubcategoriesView'
import ChannelTasksListView from '../../components/channels/ChannelTasksListView'

export default function ChannelPlatform() {
  const [searchParams] = useSearchParams()
  const channelId = searchParams.get('channel')
  const subcategoryId = searchParams.get('subcategory')

  // Level 3: Tasks View (has both channel and subcategory)
  if (channelId && subcategoryId) {
    return <ChannelTasksListView />
  }

  // Level 2: Subcategories View (has channel only)
  if (channelId) {
    return <ChannelSubcategoriesView />
  }

  // Level 1: Channels View (default)
  return <ChannelsListView />
}
