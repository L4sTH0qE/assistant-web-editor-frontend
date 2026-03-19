import React, {useEffect, useState} from 'react';
import {
    Alert,
    Avatar,
    Card,
    Col,
    Form,
    List,
    message,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Tag,
    Typography
} from 'antd';
import {FileTextOutlined, SyncOutlined, TrophyOutlined, UserOutlined, WarningOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import api from '../utils/api';

const {Title, Text} = Typography;
const {Option} = Select;

const PAGE_TYPES = {
    BASIC: {label: 'Простая страница', color: 'var(--hse-blue-accent)'},
    NEWS: {label: 'Новость', color: 'var(--hse-green-accent)'},
    ANNOUNCEMENT: {label: 'Анонс', color: 'var(--hse-orange-accent)'}
};

const SYNC_STATUSES = {
    DRAFT: {text: 'Черновик (Не выгружалось)', status: 'default'},
    SYNCED: {text: 'Синхронизировано', status: 'success'},
    DESYNCED: {text: 'Рассинхронизация', status: 'error'},
};

const AnalyticsPage = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({totalPages: 0, byType: {}, rubrics: {}, authorsActive: {}});

    const [form] = Form.useForm();
    const typeValue = Form.useWatch('type', form);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pagesRes, statsRes] = await Promise.all([
                api.get('/pages'),
                api.get('/analytics').catch(() => ({data: {totalPages: 0, byType: {}, rubrics: {}, authorsActive: {}}})) // Фолбэк если API еще не готово
            ]);
            setPages(pagesRes.data);
            setStats(statsRes.data);
        } catch (error) {
            message.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const syncedCount = stats.syncStatuses?.SYNCED || 0;
    const desyncCount = stats.syncStatuses?.DESYNCED || 0;

    return (
        <div>
            <Title level={2} style={{color: 'var(--hse-blue)', fontFamily: 'HSE Sans'}}>Аналитика</Title>
            <div>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <Alert
                        title="Аналитика по опубликованным и созданным материалам"
                        type="info" showIcon
                    />
                </div>
                <div>
                    <Row gutter={[16, 16]}>
                        <Col span={8}>
                            <Card><Statistic title="Всего материалов" value={stats.totalPages}
                                             prefix={<FileTextOutlined/>}/></Card>
                        </Col>
                        <Col span={8}>
                            <Card><Statistic title="Синхронизировано с сайтом" value={syncedCount}
                                             prefix={<SyncOutlined style={{color: '#52c41a'}}/>}/></Card>
                        </Col>
                        <Col span={8}>
                            <Card><Statistic title="Рассинхронизация (Ожидают переноса)" value={desyncCount}
                                             prefix={<WarningOutlined
                                                 style={{color: 'var(--hse-red-accent)'}}/>}/></Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} style={{marginTop: 16}}>
                        {/* Активность редакторов */}
                        <Col span={8}>
                            <Card title="Топ редакторов (Активность)" style={{height: '100%'}}>
                                <List
                                    dataSource={Object.entries(stats.authorsActive || {}).slice(0, 5)}
                                    renderItem={([author, count], index) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar
                                                    style={{backgroundColor: index === 0 ? '#faad14' : 'var(--hse-blue)'}}
                                                    icon={index === 0 ? <TrophyOutlined/> : <UserOutlined/>}/>}
                                                title={author}
                                                description={`Опубликовано материалов: ${count}`}
                                            />
                                        </List.Item>
                                    )}
                                    locale={{emptyText: 'Нет данных'}}
                                />
                            </Card>
                        </Col>

                        {/* Популярные Рубрики и Теги */}
                        <Col span={8}>
                            <Card title="Популярные Рубрики и Теги" style={{height: '100%'}}>
                                <Text strong style={{display: 'block', marginBottom: 8}}>Топ рубрик:</Text>
                                <Space size={[0, 8]} wrap style={{marginBottom: 16}}>
                                    {Object.entries(stats.rubrics || {}).map(([name, count]) => (
                                        <Tag color="blue" key={name}>{name} ({count})</Tag>
                                    ))}
                                </Space>
                                <Text strong style={{display: 'block', marginBottom: 8}}>Частые теги:</Text>
                                <Space size={[0, 8]} wrap>
                                    {Object.entries(stats.tags || {}).map(([name, count]) => (
                                        <Tag color="green" key={name}>{name} ({count})</Tag>
                                    ))}
                                </Space>
                            </Card>
                        </Col>

                        {/* Доли контента */}
                        <Col span={8}>
                            <Card title="Типы контента" style={{height: '100%'}}>
                                <List
                                    dataSource={Object.entries(PAGE_TYPES)}
                                    renderItem={([key, conf]) => {
                                        const count = stats.byType?.[key] || 0;
                                        const percent = stats.totalPages ? Math.round((count / stats.totalPages) * 100) : 0;
                                        return (
                                            <List.Item>
                                                <div style={{width: '100%'}}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                                        <Text>{conf.label}</Text>
                                                        <Text strong>{count} шт.</Text>
                                                    </div>
                                                    <Progress percent={percent} strokeColor={conf.color}
                                                              status="active"/>
                                                </div>
                                            </List.Item>
                                        )
                                    }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
